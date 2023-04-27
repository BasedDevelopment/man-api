import { NodeType, parse } from "node-html-parser";
import { table as table$1 } from "table";
const markdownEscape = (string) =>
  [
    [/\*/g, "\\*"],
    [/#/g, "\\#"],
    [/\//g, "\\/"],
    [/\(/g, "\\("],
    [/\)/g, "\\)"],
    [/\[/g, "\\["],
    [/\]/g, "\\]"],
    [/_/g, "\\_"],
    [/`/g, "\\`"],
    [/​/g, ""] // remove zero width spaces
  ].reduce(
    (string, replacement) => string.replace(replacement[0], replacement[1]),
    string
  );
/**
 * @fileoverview Abbreviation element translator
 */
//Export
var abbreviation = {
  inline: true,
  tags: ["ABBR"],
  translate: (element) => {
    //Translate children
    let { markdown, images } = translate(element, true);
    //Add title
    if (element.hasAttribute("title")) {
      markdown = `${markdown} (${element.getAttribute("title")})`;
    }
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Anchor element translator
 */
//Export
var anchor = {
  inline: true,
  tags: ["A"],
  translate: (element) => {
    //Translate children
    let { markdown, images } = translate(element, true);
    //Ensure the anchor has a hypertext reference
    if (!element.hasAttribute("href")) {
      return { markdown, images };
    }
    //Get href
    const href = element.getAttribute("href");
    //URL-only anchors
    if (markdown.length == 0) {
      markdown = `[${href}](${href})`;
    }
    //Named anchors
    else {
      markdown = `[${markdown}](${href})`;
    }
    return {
      markdown,
      images,
    };
  },
};

const unbold = (string) => string.replace(/(?<!\\)\*\*/g, "");
const unitalic = (string) => string.replace(/(?<![\\*])\*(?!\*(?!\*))/g, "");
/**
 * @fileoverview Block-style bold element translator
 */
//Export
var blockBold = {
  inline: false,
  tags: ["H1", "H2", "H3", "H4", "H5", "H6"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `​**${unbold(markdown)}**`,
      images,
    };
  },
};

/**
 * @fileoverview Block-style code element translator
 */
//Export
var blockCode = {
  inline: false,
  tags: ["PRE"],
  translate: (element) => {
    //Data
    const code = element.text;
    let language = "";
    //Update language with parent lang
    if (element.hasAttribute("lang")) {
      language = element.getAttribute("lang");
    }
    //Nested code
    for (const child of element.childNodes) {
      if (child.nodeType == NodeType.ELEMENT_NODE && child.tagName == "CODE") {
        //Update language with child lang
        if (child.hasAttribute("lang")) {
          language = child.getAttribute("lang");
        }
      }
    }
    return {
      markdown: `\`\`\`${language}\n${code.trim()}\n\`\`\``,
    };
  },
};

/**
 * @fileoverview Block-style italicized element translator
 */
//Export
var blockItalicized = {
  inline: true,
  tags: ["ADDRESS", "FIGCAPTION"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `*${unitalic(markdown).trim()}*`,
      images,
    };
  },
};

/**
 * @fileoverview Block-style plain text element translator
 */
//Export
var blockPlain = {
  inline: false,
  tags: ["P"],
  translate: (element) => {
    //Translate children
    let { markdown, images } = translate(element, true);
    //Trim whitespace
    markdown = markdown.trim();
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Block-style quote element translator
 */
//Export
var blockQuote = {
  inline: false,
  tags: ["BLOCKQUOTE"],
  translate: (element) => {
    //Prepend each line with "> "
    let markdown = element.text
      .split(/[\r\n]{1,2}/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `> ${line}`)
      .join("\n");
    //Add citation
    if (element.hasAttribute("cite")) {
      markdown += `\n[Source](${element.getAttribute("cite")})`;
    }
    return {
      markdown,
    };
  },
};

/**
 * @fileoverview Deleted text element translator
 */
//Export
var deleted = {
  inline: true,
  tags: ["DEL"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `~~${markdown}~~`,
      images,
    };
  },
};

/**
 * @fileoverview Description list element translator
 */
//Export
var descriptionList = {
  inline: false,
  tags: ["DL"],
  translate: (element) => {
    //Generate content
    let markdown = "";
    const images = [];
    //Iterate over children
    for (const child of element.childNodes) {
      //Only translate element nodes
      if (child.nodeType == NodeType.ELEMENT_NODE) {
        //Translate the child
        const { markdown: childMarkdown, images: childImages } = translate(
          child,
          true
        );
        //Term
        if (child.tagName == "DT") {
          //Add the term
          markdown += `**${unbold(childMarkdown)}**\n`;
        }
        //Details
        else {
          //Add the term
          markdown +=
            childMarkdown
              .split(/[\r\n]{1,2}/)
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .map((line) => `> ${line}`)
              .join("\n") + "\n";
        }
        //Add images
        images.push(...childImages);
      }
    }
    //Remove trailing whitespace
    markdown = markdown.trimRight();
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Image element translator
 */
//Export
var image = {
  inline: true,
  tags: ["IMG"],
  translate: (element) => {
    //Ensure the image has source
    if (!element.hasAttribute("src")) {
      throw new Error("Image element must provide source (src)!");
    }
    //Get the source
    const src = element.getAttribute("src");
    //Construct the image metadata
    const image = {
      src: src,
    };
    //Add alternate text
    if (element.hasAttribute("alt")) {
      image.alt = element.getAttribute("alt");
    }
    return {
      images: [image],
    };
  },
};

/**
 * @fileoverview Inline-style bold element translator
 */
//Export
var inlineBold = {
  inline: true,
  tags: ["B", "DT", "MARK", "STRONG"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `**${unbold(markdown)}**`,
      images,
    };
  },
};

/**
 * @fileoverview Inline-style code element translator
 */
//Export
var inlineCode = {
  inline: true,
  tags: ["CODE", "KBD", "SAMP", "VAR"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `\`${markdown}\``,
      images,
    };
  },
};

/**
 * @fileoverview Inline-style italicized element translator
 */
//Export
var inlineItalicized = {
  inline: true,
  tags: ["CITE", "DFN", "EM", "I", "SMALL"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `*${unitalic(markdown)}*`,
      images,
    };
  },
};

/**
 * @fileoverview Inline-style plain text element translator
 */
//Export
var inlinePlain = {
  inline: true,
  tags: ["SPAN"],
  translate: (element) => {
    //Translate children
    let { markdown, images } = translate(element, true);
    //Trim whitespace
    markdown = markdown.trim();
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Inline-style quote element translator
 */
//Export
var inlineQuote = {
  inline: true,
  tags: ["Q"],
  translate: (element) => {
    //Translate children
    let { markdown, images } = translate(element, true);
    //Wrap in inline code
    markdown = `\`${markdown}\``;
    //Add citation
    if (element.hasAttribute("cite")) {
      markdown += ` ([Source](${element.getAttribute("cite")}))`;
    }
    //Trim whitespace
    markdown = markdown.trim();
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Line break element translator
 */
//Export
var lineBreak = {
  inline: true,
  tags: ["BR", "HR"],
  translate: (_) => ({
    markdown: "\n",
  }),
};

/**
 * @fileoverview Ordered list element translator
 */
//Export
var orderedList = {
  inline: false,
  tags: ["OL"],
  translate: (element) => {
    //Generate content
    let markdown = "";
    const images = [];
    //Iterate over children
    let index = 1;
    for (const child of element.childNodes) {
      //Only translate element nodes
      if (child.nodeType == NodeType.ELEMENT_NODE) {
        //Translate the child
        const { markdown: childMarkdown, images: childImages } = translate(
          child,
          true
        );
        //Add the child
        markdown += `${index}. ${childMarkdown}\n`;
        //Add images
        images.push(...childImages);
        //Advance the index
        index++;
      }
    }
    //Remove trailing whitespace
    markdown = markdown.trimRight();
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Bold block-style element translator
 */
/**
 * Extract data from a row
 * @param row Row to extract from
 * @returns Row data
 */
const extractRow = (row) => {
  const data = [];
  //Iterate over cells
  for (const cell of row.childNodes) {
    //Only translate table cells
    if (
      cell.nodeType == NodeType.ELEMENT_NODE &&
      (cell.tagName == "TD" || cell.tagName == "TH")
    ) {
      //Extract the data
      data.push(cell.text.trim().replace(/\s+/g, " "));
    }
  }
  return data;
};
//Export
var table = {
  inline: false,
  tags: ["TABLE"],
  translate: (element) => {
    let header;
    const data = [];
    //Iterate over children
    for (const child of element.childNodes) {
      //Only translate element nodes
      if (child.nodeType == NodeType.ELEMENT_NODE) {
        //Cast
        const tableChild = child;
        //Get the header from the caption
        if (tableChild.tagName == "CAPTION") {
          //Extract the header
          header = child.text;
        }
        //Get the data from the head or body
        else if (
          tableChild.tagName == "THEAD" ||
          tableChild.tagName == "TBODY"
        ) {
          //Iterate over rows
          for (const row of tableChild.childNodes) {
            //Only translate table rows
            if (
              child.nodeType == NodeType.ELEMENT_NODE &&
              row.tagName == "TR"
            ) {
              data.push(extractRow(row));
            }
          }
        }
        //Get the data from rows
        else if (tableChild.tagName == "TR") {
          data.push(extractRow(tableChild));
        }
      }
    }
    //Generate the table
    let markdown = table$1(data, {
      header:
        header != null
          ? {
              alignment: "center",
              content: header,
            }
          : undefined,
    });
    //Wrap in code block and trim
    markdown = `\`\`\`\n${markdown.trimEnd()}\n\`\`\``;
    return {
      markdown,
    };
  },
};

/**
 * @fileoverview Underlined text element translator
 */
//Export
var underlined = {
  inline: true,
  tags: ["INS", "U"],
  translate: (element) => {
    //Translate children
    const { markdown, images } = translate(element, true);
    return {
      markdown: `__${markdown}__`,
      images,
    };
  },
};

/**
 * @fileoverview Unordered list element translator
 */
//Export
var unorderedList = {
  inline: false,
  tags: ["UL"],
  translate: (element) => {
    //Generate content
    let markdown = "";
    const images = [];
    //Iterate over children
    for (const child of element.childNodes) {
      //Only translate element nodes
      if (child.nodeType == NodeType.ELEMENT_NODE) {
        //Translate the child
        const { markdown: childMarkdown, images: childImages } = translate(
          child,
          true
        );
        //Add the child
        markdown += ` • ${childMarkdown.trim()}\n`;
        //Add images
        images.push(...childImages);
      }
    }
    //Remove trailing whitespace
    markdown = markdown.trimRight();
    return {
      markdown,
      images,
    };
  },
};

/**
 * @fileoverview Element translator
 */
//All translators
const translators = [
  abbreviation,
  anchor,
  blockBold,
  blockCode,
  blockItalicized,
  blockPlain,
  blockQuote,
  deleted,
  descriptionList,
  image,
  inlineBold,
  inlineCode,
  inlineItalicized,
  inlinePlain,
  inlineQuote,
  lineBreak,
  orderedList,
  table,
  underlined,
  unorderedList,
];
//Regex to test if a string ends in a new line
const endNewline = /[\r\n]{1,2}$/;
//Regex to test if a string ends in whitespace
const endWhitespace = /\s+$/;
/**
 * Translate an HTML element to Discord flavored markdown
 * @param element HTML element
 * @param plaintext Whether or not to capture untagged plaintext
 * @returns Translator result
 */
const translate = (element, plaintext) => {
  let markdown = "";
  const images = [];
  //Iterate over children
  for (const node of element.childNodes) {
    //Translate element nodes
    if (node.nodeType == NodeType.ELEMENT_NODE) {
      //Cast
      const child = node;
      //Find the correct translator
      const translator = translators.find((translator) =>
        translator.tags.includes(child.tagName)
      );
      //Translate the element
      if (translator != null) {
        const result = translator.translate(child);
        //Add results
        if (result.markdown != null) {
          //Inline-style elements
          if (translator.inline) {
            //Add a leading space if the previous element didn't edit with whitespace
            if (!endWhitespace.test(markdown)) {
              markdown += " ";
            }
            markdown += result.markdown;
          }
          //Block-style elements
          else {
            //Add a leading new line if the previous element didn't end with one
            if (!endNewline.test(markdown)) {
              markdown += "\n";
            }
            //Add markdown
            markdown += result.markdown;
            //Add a trailing new line if the element didn't end with one
            if (!endNewline.test(result.markdown)) {
              markdown += "\n";
            }
          }
        }
        //Add images
        if (result.images != null) {
          images.push(...result.images);
        }
      } else {
        //Recur
        const result = translate(child, plaintext);
        //Add markdown
        markdown += result.markdown;
        //Add images
        if (result.images != null) {
          images.push(...result.images);
        }
      }
    }
    //Translate element nodes
    else if (
      plaintext &&
      node.nodeType == NodeType.TEXT_NODE &&
      !node.isWhitespace
    ) {
      //Cast
      const child = node;
      //Add markdown
      markdown += markdownEscape(child.trimmedText.replace(/\s+/g, " "));
    }
  }
  return {
    markdown,
    images,
  };
};

/**
 * @fileoverview Utilities
 */
/**
 * Parser options
 */
const options = {
  blockTextElements: {
    code: true,
    noscript: true,
    script: true,
    style: true,
  },
};

/**
 * @fileoverview HTML translator
 */
/**
 * Translate raw HTML to Discord flavored markdown
 * @param raw Raw HTML
 * @param plaintext Whether or not to capture untagged plaintext
 * @returns Discord flavored markdown, images
 */
const main = (raw, plaintext = false) => {
  //Parse the HTML
  const root = parse(raw, options);
  //Translate
  const result = translate(root, plaintext);
  //Trim markdown
  result.markdown = result.markdown.trim();
  return result;
};

export { main as default };
