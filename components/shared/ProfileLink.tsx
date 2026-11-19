import Image from "next/image";
import Link from "next/link";

interface ProfileLinkProps {
  imgUrl: string;
  title: string;
  href?: string;
}

export default function ProfileLink({ imgUrl, title, href }: ProfileLinkProps) {
  const safeHref = href && /^https?:\/\//i.test(href) ? href : undefined;
  return (
    <div className="flex-center gap-1">
      <Image src={imgUrl} alt="icon" height={20} width={20} />
      {safeHref ? (
        <Link
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="paragraph-medium text-blue-500"
        >
          {title}
        </Link>
      ) : (
        <p className="paragraph-medium text-dark400_light700">{title}</p>
      )}
    </div>
  );
}
