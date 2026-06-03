import Typography from '@/shared/components/base/Typography';

type AdminFlashBannerProps = {
  tone: 'success' | 'error';
  text: string;
};

export default function AdminFlashBanner({
  tone,
  text,
}: AdminFlashBannerProps) {
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
