import AdminPagination from '@/shared/components/admin/AdminPagination';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Typography from '@/shared/components/base/Typography';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/formatters';
import ConfirmSubmitButton from './ConfirmSubmitButton';
import {
  buildSettingsSearch,
  normalizeAuditPage,
  normalizeAuditValue,
  parseSettingsFlash,
  validateDiscountForm,
} from './settings.helpers';

type DiscountCode = {
  id: string;
  code: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
  usedBy: Array<{ id: string }>;
};

type AuditLog = {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  reason: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    email: string;
    fullName?: string | null;
    role?: string | null;
    profile: {
      fullName: string | null;
    } | null;
  };
};

type AuditLogsPayload = {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
};

type SettingsPageProps = {
  searchParams?: {
    entity?: string;
    action?: string;
    actor?: string;
    page?: string;
    discountSuccess?: string;
    discountMessage?: string;
  };
};

export async function SettingsPage({ searchParams }: SettingsPageProps) {
  const entity = normalizeAuditValue(searchParams?.entity);
  const action = searchParams?.action?.trim() ?? '';
  const actor = searchParams?.actor?.trim() ?? '';
  const page = normalizeAuditPage(searchParams?.page);
  const flash = parseSettingsFlash(searchParams);
  const auditQuery = new URLSearchParams({
    limit: '25',
    page: String(page),
  });

  if (entity !== 'ALL') {
    auditQuery.set('entity', entity);
  }

  if (action) {
    auditQuery.set('action', action);
  }

  if (actor) {
    auditQuery.set('actor', actor);
  }

  const [discountCodesState, auditState] = await Promise.all([
    fetchAdminApi<DiscountCode[]>('/v1/admin/discount-codes')
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: Error) => ({
        data: [] as DiscountCode[],
        error: error.message || 'Unable to load discount codes.',
      })),
    fetchAdminApi<AuditLogsPayload>(
      `/v1/admin/audit-logs?${auditQuery.toString()}`,
    )
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: Error) => ({
        data: { logs: [], total: 0, page, totalPages: 0 },
        error: error.message || 'Unable to load audit logs.',
      })),
  ]);

  async function createDiscountCode(formData: FormData) {
    'use server';

    const code = String(formData.get('code') || '').trim();
    const expiresAt = String(formData.get('expiresAt') || '').trim();
    const amount = String(formData.get('amount') || '').trim();
    const baseSearch = buildSettingsSearch({ entity, action, actor, page: String(page) });
    const redirectParams = new URLSearchParams(baseSearch);
    const errors = validateDiscountForm({ code, amount, expiresAt });

    if (Object.keys(errors).length) {
      redirectParams.set('discountError', 'validation');
      redirectParams.set('discountMessage', Object.values(errors).join('. '));
      redirect(`/settings?${redirectParams.toString()}`);
    }

    try {
      await fetchAdminApi('/v1/admin/discount-codes', {
        method: 'POST',
        body: JSON.stringify({ code, amount: Number(amount), expiresAt }),
      });
    } catch (error) {
      redirectParams.set('discountError', 'request');
      redirectParams.set(
        'discountMessage',
        error instanceof Error ? error.message : 'Failed to create code.',
      );
      redirect(`/settings?${redirectParams.toString()}`);
    }

    revalidatePath('/settings');
    redirectParams.set('discountSuccess', 'created');
    redirectParams.set('discountMessage', `Discount code ${code.toUpperCase()} created.`);
    redirect(`/settings?${redirectParams.toString()}`);
  }

  async function deleteDiscountCode(formData: FormData) {
    'use server';

    const id = String(formData.get('id') || '');
    const code = String(formData.get('code') || '').trim();
    const baseSearch = buildSettingsSearch({ entity, action, actor, page: String(page) });
    const redirectParams = new URLSearchParams(baseSearch);

    if (!id) {
      redirectParams.set('discountError', 'missing-id');
      redirectParams.set('discountMessage', 'Discount code id is missing.');
      redirect(`/settings?${redirectParams.toString()}`);
    }

    try {
      await fetchAdminApi(`/v1/admin/discount-codes/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      redirectParams.set('discountError', 'request');
      redirectParams.set(
        'discountMessage',
        error instanceof Error ? error.message : 'Failed to delete code.',
      );
      redirect(`/settings?${redirectParams.toString()}`);
    }

    revalidatePath('/settings');
    redirectParams.set('discountSuccess', 'deleted');
    redirectParams.set('discountMessage', `Discount code ${code || 'entry'} deleted.`);
    redirect(`/settings?${redirectParams.toString()}`);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
          Discount Codes
        </Typography>
        <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
          Create and remove platform-wide discount codes.
        </Typography>

        {flash ? (
          <div
            className={`mt-4 rounded-[20px] border p-4 ${
              flash.tone === 'success'
                ? 'border-green-200 bg-green-light'
                : 'border-red-200 bg-red-light'
            }`}
          >
            <Typography
              variant={{ base: 'body-3' }}
              color={flash.tone === 'success' ? 'green-normal' : 'red-normal'}
            >
              {flash.message}
            </Typography>
          </div>
        ) : null}

        <form action={createDiscountCode} className="mt-5 grid gap-3 lg:grid-cols-4">
          <input
            type="text"
            name="code"
            placeholder="Code"
            className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
          />
          <input
            type="number"
            min="1"
            name="amount"
            placeholder="Amount"
            className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
          />
          <input
            type="datetime-local"
            name="expiresAt"
            className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
          >
            Create code
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {discountCodesState.error ? (
            <div className="rounded-[20px] border border-red-200 bg-red-light p-4">
              <Typography variant={{ base: 'body-3' }} color="red-normal">
                Discount codes failed to load: {discountCodesState.error}
              </Typography>
            </div>
          ) : discountCodesState.data.length ? (
            discountCodesState.data.map((code) => (
              <article key={code.id} className="rounded-[20px] bg-neutral-25 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Typography variant={{ base: 'title-3' }} color="neutral-900">
                      {code.code}
                    </Typography>
                    <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                      {formatCurrency(code.amount)} off, expires {formatDateTime(code.expiresAt)}
                    </Typography>
                    <Typography variant={{ base: 'body-4' }} color="neutral-400" className="mt-1">
                      Created {formatDate(code.createdAt)} | Used by {code.usedBy.length} students
                    </Typography>
                  </div>
                  <form action={deleteDiscountCode}>
                    <input type="hidden" name="id" value={code.id} />
                    <input type="hidden" name="code" value={code.code} />
                    <ConfirmSubmitButton
                      message={`Delete discount code ${code.code}? This cannot be undone.`}
                      className="rounded-2xl border border-red-200 px-4 py-3 text-label-3 text-red-normal"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <Typography variant={{ base: 'body-3' }} color="neutral-500">
              No discount codes yet.
            </Typography>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Audit Log
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
              Review administrative and product-side actions captured by the backend.
            </Typography>
          </div>
          <form
            action="/settings"
            className="grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]"
          >
            <input
              type="text"
              name="entity"
              defaultValue={entity === 'ALL' ? '' : entity}
              placeholder="Filter entity"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <input
              type="text"
              name="action"
              defaultValue={action}
              placeholder="Filter action"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <input
              type="text"
              name="actor"
              defaultValue={actor}
              placeholder="Filter actor"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
            >
              Filter
            </button>
            <a
              href="/settings"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-center text-label-3 text-neutral-700"
            >
              Reset
            </a>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          {auditState.error ? (
            <div className="rounded-[20px] border border-red-200 bg-red-light p-4">
              <Typography variant={{ base: 'body-3' }} color="red-normal">
                Audit logs failed to load: {auditState.error}
              </Typography>
            </div>
          ) : auditState.data.logs.length ? (
            auditState.data.logs.map((log) => (
              <article key={log.id} className="rounded-[20px] bg-neutral-25 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Typography variant={{ base: 'title-3' }} color="neutral-900">
                      {log.action}
                    </Typography>
                    <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                      {log.entity} · {log.entityId}
                    </Typography>
                  </div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-400">
                    {formatDateTime(log.createdAt)}
                  </Typography>
                </div>
                <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-3">
                  Actor: {log.actor.profile?.fullName ?? log.actor.fullName ?? log.actor.email}
                </Typography>
                <Typography variant={{ base: 'body-4' }} color="neutral-400" className="mt-1">
                  {log.actor.email}
                  {log.actor.role ? ` · ${log.actor.role}` : ''}
                </Typography>
                {log.reason ? (
                  <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                    Reason: {log.reason}
                  </Typography>
                ) : null}
                {log.metadata ? (
                  <Typography variant={{ base: 'body-4' }} color="neutral-400" className="mt-1">
                    Context: {JSON.stringify(log.metadata)}
                  </Typography>
                ) : null}
              </article>
            ))
          ) : (
            <Typography variant={{ base: 'body-3' }} color="neutral-500">
              No audit log records match this filter.
            </Typography>
          )}
        </div>

        <div className="mt-4">
          <AdminPagination
            page={auditState.data.page}
            totalPages={auditState.data.totalPages}
            buildHref={(nextPage) => {
              const query = buildSettingsSearch({
                entity,
                action,
                actor,
                page: String(nextPage),
              });
              return query ? `/settings?${query}` : '/settings';
            }}
          />
        </div>
      </section>
    </div>
  );
}
