type ApplicationsLayoutProps = {
  children: React.ReactNode;
};

export default function ApplicationsLayout({ children }: ApplicationsLayoutProps) {
  return <div className="-m-4 md:-m-8">{children}</div>;
}
