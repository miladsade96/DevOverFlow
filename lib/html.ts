import sanitizeHtml from "sanitize-html";

export function cleanHtml(content: string) {
  return sanitizeHtml(content, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      a: ["href", "title", "rel"],
      img: ["src", "alt", "width", "height"],
      code: ["class"],
      pre: ["class"],
    },
    allowedClasses: {
      code: ["language-*"],
      pre: ["language-*", "line-numbers"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "nofollow noopener noreferrer",
      }),
    },
  });
}
