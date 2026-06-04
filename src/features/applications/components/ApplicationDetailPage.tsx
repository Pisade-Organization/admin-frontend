import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Avatar from '@/shared/components/base/Avatar';
import Typography from '@/shared/components/base/Typography';
import { appendQuery, getAdminFlashMessage } from '@/shared/lib/adminPageState';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import { formatDate } from '@/shared/lib/formatters';
import {
  formatCompactNumber,
  formatCurrency,
  getTutorApplicationDetail,
} from './applications.data';
import {
  buildApplicationDetailHref,
  buildApplicationsReturnHref,
} from './applications.helpers';

type ApplicationDetailPageProps = {
  tutorId: string;
  searchParams: {
    q?: string;
    sort?: string;
    status?: string;
    page?: string;
    notice?: string;
    error?: string;
  };
};

function getStatusUpdatePath(tutorId: string, nextStatus: string) {
  if (nextStatus === 'APPROVED') {
    return `/v1/admin/tutors/${tutorId}/approve`;
  }

  return `/v1/admin/tutors/${tutorId}/status`;
}

function getStatusTone(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700';
    case 'SUSPENDED':
      return 'bg-violet-50 text-violet-700';
    case 'REVIEWING':
      return 'bg-amber-50 text-amber-700';
    case 'DRAFT':
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'REVIEWING':
      return 'Processing';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'SUSPENDED':
      return 'Restricted';
    case 'DRAFT':
    default:
      return 'Draft';
  }
}

function Banner({
  tone,
  text,
}: {
  tone: 'success' | 'error';
  text: string;
}) {
  const toneClassName =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className={`rounded-[20px] border p-4 ${toneClassName}`}>
      <Typography variant={{ base: 'body-3' }} color="inherit">
        {text}
      </Typography>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-neutral-25 p-4">
      <Typography variant={{ base: 'label-4' }} color="neutral-500">
        {label}
      </Typography>
      <Typography
        variant={{ base: 'title-3' }}
        color="neutral-900"
        className="mt-1"
      >
        {value}
      </Typography>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-1">
        <Typography variant={{ base: 'title-4' }} color="neutral-900">
          {title}
        </Typography>
        {description ? (
          <Typography variant={{ base: 'body-3' }} color="neutral-500">
            {description}
          </Typography>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Typography variant={{ base: 'label-4' }} color="neutral-500">
        {label}
      </Typography>
      <div className="text-body-3 text-neutral-800">{value}</div>
    </div>
  );
}

function EmptyValue({ text }: { text: string }) {
  return (
    <Typography variant={{ base: 'body-3' }} color="neutral-500">
      {text}
    </Typography>
  );
}

function AssetLink({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return <EmptyValue text={`No ${label.toLowerCase()} provided.`} />;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-body-3 text-deep-royal-indigo-500 underline underline-offset-2"
    >
      Open {label}
    </a>
  );
}

function dayOfWeekLabel(dayOfWeek: number | null) {
  const labels = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek >= labels.length) {
    return 'Unknown day';
  }

  return labels[dayOfWeek];
}

export async function ApplicationDetailPage({
  tutorId,
  searchParams,
}: ApplicationDetailPageProps) {
  const flashMessage = getAdminFlashMessage(searchParams);
  const backHref = buildApplicationsReturnHref(searchParams);
  const currentUrl = buildApplicationDetailHref(tutorId, searchParams);
  const data = await getTutorApplicationDetail(tutorId)
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: null,
      error: error.message || 'Unable to load application detail.',
    }));

  async function updateTutorStatus(formData: FormData) {
    'use server';

    const nextStatus = String(formData.get('status') || '');
    const returnTo = String(formData.get('returnTo') || currentUrl);

    if (!nextStatus) {
      redirect(appendQuery(returnTo, 'error', 'Missing tutor status update.'));
    }

    const path = getStatusUpdatePath(tutorId, nextStatus);
    const init =
      nextStatus === 'APPROVED'
        ? { method: 'PATCH' as const }
        : {
            method: 'PATCH' as const,
            body: JSON.stringify({ status: nextStatus }),
          };

    try {
      await fetchAdminApi(path, init);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not update tutor status.';

      redirect(appendQuery(returnTo, 'error', message));
    }

    revalidatePath('/applications');
    revalidatePath(`/applications/${tutorId}`);

    const notice =
      nextStatus === 'APPROVED'
        ? 'Tutor approved.'
        : nextStatus === 'REJECTED'
          ? 'Application rejected.'
          : 'Tutor suspended.';

    redirect(appendQuery(returnTo, 'notice', notice));
  }

  if (!data.result) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6">
        <Link
          href={backHref}
          className="inline-flex text-label-3 text-deep-royal-indigo-500"
        >
          Back to applications
        </Link>
        <Typography
          variant={{ base: 'title-4' }}
          color="rose-700"
          className="mt-3"
        >
          Application detail could not be loaded.
        </Typography>
        <Typography
          variant={{ base: 'body-3' }}
          color="rose-700"
          className="mt-2"
        >
          {data.error}
        </Typography>
      </div>
    );
  }

  const application = data.result;
  const { stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix, stepSeven, stepEight, stepNine } =
    application.steps;
  const isReviewing = application.status === 'REVIEWING';

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4">
            <Link
              href={backHref}
              className="inline-flex text-label-3 text-deep-royal-indigo-500"
            >
              Back to applications
            </Link>

            <div className="flex items-center gap-4">
              <Avatar
                src={application.avatarUrl}
                alt={application.fullName}
                name={application.fullName}
                sizeClassName="h-16 w-16"
                textClassName="text-label-2"
              />

              <div className="flex flex-col gap-1">
                <div
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusTone(application.status)}`}
                >
                  {getStatusLabel(application.status)}
                </div>
                <Typography
                  variant={{ base: 'title-2', lg: 'title-1' }}
                  color="neutral-900"
                >
                  {application.fullName}
                </Typography>
                <Typography variant={{ base: 'body-3' }} color="neutral-500">
                  {application.subject ?? 'No subject provided'}
                </Typography>
                <Typography variant={{ base: 'body-3' }} color="neutral-500">
                  Joined {formatDate(application.joinedAt)}
                </Typography>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-neutral-25 p-4 lg:max-w-[320px]">
            <Typography variant={{ base: 'label-3' }} color="neutral-700">
              Review summary
            </Typography>
            <Typography
              variant={{ base: 'body-3' }}
              color="neutral-500"
              className="mt-2"
            >
              This page shows the tutor&apos;s full onboarding submission across
              all review-sensitive steps.
            </Typography>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <DetailStat label="Rating" value={application.stats.avgRating.toFixed(1)} />
          <DetailStat
            label="Students"
            value={formatCompactNumber(application.stats.studentsCount)}
          />
          <DetailStat
            label="Lessons"
            value={formatCompactNumber(application.stats.lessonsCount)}
          />
          <DetailStat label="Base rate" value={formatCurrency(application.baseRate)} />
        </div>

        {isReviewing ? (
          <div className="mt-5 flex gap-3">
            <form action={updateTutorStatus} className="flex-1">
              <input type="hidden" name="status" value="REJECTED" />
              <input type="hidden" name="returnTo" value={currentUrl} />
              <button
                type="submit"
                className="w-full rounded-2xl border border-rose-200 px-4 py-3 text-label-3 text-rose-700 transition hover:bg-rose-50"
              >
                Reject
              </button>
            </form>
            <form action={updateTutorStatus} className="flex-1">
              <input type="hidden" name="status" value="APPROVED" />
              <input type="hidden" name="returnTo" value={currentUrl} />
              <button
                type="submit"
                className="w-full rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white transition hover:bg-deep-royal-indigo-600"
              >
                Approve
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {flashMessage ? <Banner tone={flashMessage.tone} text={flashMessage.text} /> : null}

      <DetailSection
        title="Step 1: Personal and teaching information"
        description="Basic identity, contact, subject, and language details."
      >
        <DetailGrid>
          <DetailField label="Full name" value={stepOne.fullName} />
          <DetailField label="Email" value={stepOne.email ?? application.email ?? '—'} />
          <DetailField label="Phone number" value={stepOne.phoneNumber ?? '—'} />
          <DetailField label="Subject" value={stepOne.subject ?? '—'} />
          <DetailField label="Country of birth" value={stepOne.countryOfBirth ?? '—'} />
          <DetailField label="Nationality" value={stepOne.nationality ?? '—'} />
          <DetailField label="Adult confirmation" value={stepOne.isOver18 == null ? '—' : stepOne.isOver18 ? 'Yes' : 'No'} />
          <DetailField
            label="Languages"
            value={
              stepOne.languages.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {stepOne.languages.map((language) => (
                    <span key={language.id}>
                      {language.name ?? 'Unknown language'}
                      {language.level ? ` (${language.level})` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyValue text="No languages submitted." />
              )
            }
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Step 2: Profile photo"
        description="Avatar submitted during onboarding."
      >
        {stepTwo.avatarUrl ? (
          <div className="flex flex-col gap-3">
            <img
              src={stepTwo.avatarUrl}
              alt={`${application.fullName} onboarding avatar`}
              className="h-48 w-48 rounded-[24px] object-cover"
            />
            <AssetLink href={stepTwo.avatarUrl} label="Profile photo" />
          </div>
        ) : (
          <EmptyValue text="No profile photo submitted." />
        )}
      </DetailSection>

      <DetailSection
        title="Step 3: Certifications"
        description="Teaching certificates and supporting credentials."
      >
        {!stepThree.hasTeachingCertificate ? (
          <EmptyValue text="Tutor marked that they do not have a teaching certificate." />
        ) : stepThree.certifications.length === 0 ? (
          <EmptyValue text="No certifications submitted." />
        ) : (
          <div className="flex flex-col gap-4">
            {stepThree.certifications.map((certification) => (
              <div
                key={certification.id}
                className="rounded-[20px] bg-neutral-25 p-4"
              >
                <DetailGrid>
                  <DetailField
                    label="Certificate"
                    value={certification.certificationName ?? '—'}
                  />
                  <DetailField
                    label="Organization"
                    value={certification.certifyingOrganization ?? '—'}
                  />
                  <DetailField
                    label="Issued by"
                    value={certification.issuedBy ?? '—'}
                  />
                  <DetailField
                    label="Years"
                    value={`${certification.startYear ?? '—'} - ${certification.endYear ?? '—'}`}
                  />
                </DetailGrid>
                <div className="mt-4">
                  <DetailField
                    label="Description"
                    value={certification.description ?? '—'}
                  />
                </div>
                <div className="mt-4">
                  <AssetLink
                    href={certification.certificateFileUrl}
                    label="Certificate file"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Step 4: Education"
        description="Diplomas and education records."
      >
        {!stepFour.hasDiploma ? (
          <EmptyValue text="Tutor marked that they do not have a diploma." />
        ) : stepFour.diplomas.length === 0 ? (
          <EmptyValue text="No diplomas submitted." />
        ) : (
          <div className="flex flex-col gap-4">
            {stepFour.diplomas.map((diploma) => (
              <div key={diploma.id} className="rounded-[20px] bg-neutral-25 p-4">
                <DetailGrid>
                  <DetailField
                    label="University"
                    value={diploma.universityName ?? '—'}
                  />
                  <DetailField label="Degree" value={diploma.degree ?? '—'} />
                  <DetailField
                    label="Field of study"
                    value={diploma.fieldOfStudy ?? '—'}
                  />
                  <DetailField
                    label="Specialization"
                    value={diploma.specialization ?? '—'}
                  />
                  <DetailField
                    label="Years"
                    value={`${diploma.yearStart ?? '—'} - ${diploma.yearEnd ?? (diploma.currentlyStudying ? 'Present' : '—')}`}
                  />
                  <DetailField
                    label="Currently studying"
                    value={diploma.currentlyStudying ? 'Yes' : 'No'}
                  />
                </DetailGrid>
                <div className="mt-4">
                  <AssetLink href={diploma.diplomaFileUrl} label="Diploma file" />
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Step 5: Tutor profile"
        description="Profile copy, experience summary, and student-facing motivation."
      >
        <div className="flex flex-col gap-4">
          <DetailField label="Catchy headline" value={stepFive.catchyHeadline ?? '—'} />
          <DetailField label="Introduce yourself" value={stepFive.introduceYourself ?? '—'} />
          <DetailField label="Teaching experience" value={stepFive.teachingExperience ?? '—'} />
          <DetailField
            label="Motivate potential students"
            value={stepFive.motivatePotentialStudents ?? '—'}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Step 6: Intro video"
        description="Video and thumbnail provided for tutor introduction."
      >
        <div className="flex flex-col gap-4">
          {stepSix.thumbnailUrl ? (
            <img
              src={stepSix.thumbnailUrl}
              alt={`${application.fullName} intro video thumbnail`}
              className="h-48 w-full max-w-md rounded-[24px] object-cover"
            />
          ) : (
            <EmptyValue text="No video thumbnail submitted." />
          )}
          <AssetLink href={stepSix.videoUrl} label="Intro video" />
        </div>
      </DetailSection>

      <DetailSection
        title="Step 7: Availability"
        description="Timezone and submitted teaching slots."
      >
        <div className="flex flex-col gap-4">
          <DetailField label="Timezone" value={stepSeven.timezone ?? '—'} />
          {stepSeven.availabilities.length === 0 ? (
            <EmptyValue text="No availability slots submitted." />
          ) : (
            <div className="flex flex-col gap-3">
              {stepSeven.availabilities.map((availability) => (
                <div
                  key={availability.id}
                  className="rounded-[20px] bg-neutral-25 p-4"
                >
                  <Typography variant={{ base: 'body-3' }} color="neutral-800">
                    {dayOfWeekLabel(availability.dayOfWeek)}: {availability.startTime ?? '—'} -{' '}
                    {availability.endTime ?? '—'}
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500">
                    {availability.timezone ?? stepSeven.timezone ?? 'No timezone'}
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </div>
      </DetailSection>

      <DetailSection
        title="Step 8: Pricing and payout"
        description="Lesson pricing and withdrawal preferences."
      >
        <DetailGrid>
          <DetailField
            label="Lesson price"
            value={formatCurrency(stepEight.lessonPrice)}
          />
          <DetailField
            label="Withdrawal method"
            value={stepEight.withdrawalMethod ?? '—'}
          />
          <DetailField
            label="PromptPay number"
            value={stepEight.withdrawalPhoneNumber ?? '—'}
          />
          <DetailField label="Bank name" value={stepEight.bankName ?? '—'} />
          <DetailField
            label="Bank account number"
            value={stepEight.bankAccountNumber ?? '—'}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Step 9: Identity documents"
        description="KYC document type and uploaded files."
      >
        <div className="flex flex-col gap-4">
          <DetailField label="Document type" value={stepNine.documentType ?? '—'} />
          <AssetLink href={stepNine.idCardUrl} label="ID card" />
          <AssetLink href={stepNine.passportUrl} label="Passport" />
        </div>
      </DetailSection>
    </div>
  );
}
