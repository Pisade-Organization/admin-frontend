import Typography from "@/shared/components/base/Typography"
export default function HighlightHeaderSection() {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:gap-0">
      <Typography variant={{ base: "label-3", lg: "label-2" }} color="neutral-900">Highlight</Typography>

      <div className="rounded-full p-0.5 border-[1.5px] bg-neutral-25 border-neutral-25">
        <button className="py-2 px-5 rounded-full bg-electric-violet-400">
          <Typography variant={{ base: "label-3" }} color="white">Today</Typography>
        </button>

        <button className="py-2 px-5 rounded-full">
          <Typography variant={{ base: "body-3" }} color="neutral-300">Week</Typography>
        </button>

        <button className="py-2 px-5 rounded-full ">
          <Typography variant={{ base: "body-3" }} color="neutral-300">Month</Typography>
        </button>
      </div>
    </div>
  )
}