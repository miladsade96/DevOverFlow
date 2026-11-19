import parse from "html-react-parser";
import { cleanHtml } from "@/lib/html";
import HighlightedContent from "./HighlightedContent";
export default function ParseHTML({ data }: { data: string }) {
  return <HighlightedContent>{parse(cleanHtml(data))}</HighlightedContent>;
}
