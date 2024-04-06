import Image from "next/image";
import Link from "next/link";

interface ProfileLinkProps {
  imgUrl: string;
  title: string;
  href?: string;
}

export default function ProfileLink({ imgUrl, title, href }: ProfileLinkProps) {
  return (
    <div className="flex-center gap-1">
      <Image src={imgUrl} alt="icon" height={20} width={20} />
      {href ? (
        <Link
          href={href}
          target="_blank"
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
