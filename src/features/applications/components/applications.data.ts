import { fetchPublicApi, logAdminRequestFailure } from '@/shared/lib/adminApi';
import { TutorStatus } from './applications.types';

export type TutorApplicationCard = {
  id: string;
  userId: string;
  status: TutorStatus;
  fullName: string;
  avatarUrl: string | null;
  subject: string;
  baseRate: number;
  avgRating: number;
  studentsCount: number;
  lessonsCount: number;
  joinedAt: string;
};

export type TutorApplicationsPayload = {
  applications: TutorApplicationCard[];
  total: number;
  page: number;
  totalPages: number;
  statuses: TutorStatus[];
  countsByStatus: Record<string, number>;
  currentStatus: TutorStatus | null;
  currentSort: ApplicationSort;
  currentQuery: string;
};

export type TutorApplicationDetail = {
  id: string;
  userId: string;
  status: TutorStatus;
  joinedAt: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  subject: string | null;
  baseRate: number;
  stats: {
    avgRating: number;
    studentsCount: number;
    lessonsCount: number;
  };
  steps: {
    stepOne: {
      fullName: string;
      firstName: string | null;
      lastName: string | null;
      countryOfBirth: string | null;
      nationality: string | null;
      countryCode: string | null;
      phoneNumber: string | null;
      email: string | null;
      isOver18: boolean | null;
      subject: string | null;
      languages: Array<{
        id: string;
        name: string | null;
        level: string | null;
      }>;
    };
    stepTwo: {
      avatarUrl: string | null;
    };
    stepThree: {
      hasTeachingCertificate: boolean;
      certifications: Array<{
        id: string;
        certificationName: string | null;
        certifyingOrganization: string | null;
        issuedBy: string | null;
        description: string | null;
        startYear: number | null;
        endYear: number | null;
        certificateFileUrl: string | null;
      }>;
    };
    stepFour: {
      hasDiploma: boolean;
      diplomas: Array<{
        id: string;
        universityName: string | null;
        degree: string | null;
        fieldOfStudy: string | null;
        specialization: string | null;
        yearStart: number | null;
        yearEnd: number | null;
        currentlyStudying: boolean;
        diplomaFileUrl: string | null;
      }>;
    };
    stepFive: {
      catchyHeadline: string | null;
      introduceYourself: string | null;
      teachingExperience: string | null;
      motivatePotentialStudents: string | null;
    };
    stepSix: {
      videoUrl: string | null;
      thumbnailUrl: string | null;
    };
    stepSeven: {
      timezone: string | null;
      availabilities: Array<{
        id: string;
        dayOfWeek: number | null;
        startTime: string | null;
        endTime: string | null;
        timezone: string | null;
      }>;
    };
    stepEight: {
      lessonPrice: number;
      withdrawalMethod: string | null;
      withdrawalPhoneNumber: string | null;
      bankName: string | null;
      bankAccountNumber: string | null;
    };
    stepNine: {
      documentType: string | null;
      idCardUrl: string | null;
      passportUrl: string | null;
    };
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type ApplicationSort =
  | 'newest'
  | 'oldest'
  | 'price_high'
  | 'price_low'
  | 'name_asc'
  | 'name_desc';

export type ApplicationsSearchParams = {
  q?: string;
  sort?: string;
  status?: string;
  page?: string;
  success?: string;
  error?: string;
};

export function getBackendBaseUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

export function parseApplicationStatus(value?: string): TutorStatus {
  const allowedStatuses: TutorStatus[] = [
    'DRAFT',
    'REVIEWING',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
  ];

  if (value && allowedStatuses.includes(value as TutorStatus)) {
    return value as TutorStatus;
  }

  return 'REVIEWING';
}

export function parseApplicationSort(value?: string): ApplicationSort {
  const allowedSorts: ApplicationSort[] = [
    'newest',
    'oldest',
    'price_high',
    'price_low',
    'name_asc',
    'name_desc',
  ];

  if (value && allowedSorts.includes(value as ApplicationSort)) {
    return value as ApplicationSort;
  }

  return 'newest';
}

export async function getTutorApplications(
  searchParams: ApplicationsSearchParams,
): Promise<TutorApplicationsPayload | null> {
  const params = new URLSearchParams();
  const q = searchParams.q?.trim();
  const status = parseApplicationStatus(searchParams.status);
  const sort = parseApplicationSort(searchParams.sort);

  params.set('status', status);
  params.set('sort', sort);

  if (q) {
    params.set('q', q);
  }

  if (searchParams.page) {
    params.set('page', searchParams.page);
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}/v1/admin/applications?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiResponse<TutorApplicationsPayload>;
    return payload.data;
  } catch (error) {
    logAdminRequestFailure(
      'getTutorApplications',
      `${getBackendBaseUrl()}/v1/admin/applications?${params.toString()}`,
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        error,
      },
    );
    return null;
  }
}

export async function getTutorApplicationDetail(
  tutorId: string,
): Promise<TutorApplicationDetail> {
  return fetchPublicApi<TutorApplicationDetail>(`/v1/admin/applications/${tutorId}`);
}

export function formatStatusLabel(status: TutorStatus) {
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

export function formatSortLabel(sort: ApplicationSort) {
  switch (sort) {
    case 'oldest':
      return 'Oldest first';
    case 'price_high':
      return 'Price: highest first';
    case 'price_low':
      return 'Price: lowest first';
    case 'name_asc':
      return 'A -> Z';
    case 'name_desc':
      return 'Z -> A';
    case 'newest':
    default:
      return 'Newest first';
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
