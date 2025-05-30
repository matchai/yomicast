import { Detail } from "@raycast/api";

export default function Command() {
  return (
    <Detail
      navigationTitle="CommonMark Showcase"
      markdown={`
# CommonMark Text Display Showcase

This document demonstrates various ways text can be displayed using CommonMark and some common extensions.

---

## 1. Headings

# Heading 1 (H1 - ATX style)
## Heading 2 (H2 - ATX style)
### Heading 3 (H3 - ATX style)
#### Heading 4 (H4 - ATX style)
##### Heading 5 (H5 - ATX style)
###### Heading 6 (H6 - ATX style)

Heading 1 (H1 - Setext style)
=============================

Heading 2 (H2 - Setext style)
-----------------------------

---

## 2. Paragraphs and Line Breaks

This is a standard paragraph. It can contain many lines of text.
The renderer will typically wrap it based on the available width.

This is another paragraph, separated by a blank line.

To force a line break  <-- (note the two spaces)
without starting a new paragraph, end a line with two or more spaces.
Like this.

Alternatively, you can use a backslash at the end of a line for a hard line break (less common but valid):\
This line ends with a backslash.

---

## 3. Emphasis and Strong Emphasis (Bold/Italic)

*This text is italic (using asterisks).*
_This text is also italic (using underscores)._

**This text is bold (using asterisks).**
__This text is also bold (using underscores).__

***This text is bold and italic (using asterisks).***
___This text is also bold and italic (using underscores).___

**_You can combine them like this (bold then italic)._**
*_Or like this (italic then bold)._*

You can also use emphasis *inside* a **word**like**this** or _inside_ a __word__like__this__.

---

## 4. Strikethrough (GFM Extension)

~~This text is struck through.~~
~~You can strike **bold** or *italic* text too.~~

---

## 5. Inline Code

Use \`inline code\` for short snippets like \`variable_name\` or \`function()\`.
If your code contains backticks, use double backticks: \`\` \`code with a backtick\` \`\`.
Or even more: \`\`\` \`\`code with \`double\` backticks\`\` \`\`\`.

---

## 6. Code Blocks

### 6.1 Indented Code Blocks

    This is an indented code block.
    It's good for simple, un-highlighted code.
        Further indentation is preserved.
    function greet() {
        console.log("Hello from indented block!");
    }

### 6.2 Fenced Code Blocks

\`\`\`
This is a fenced code block.
No language specified.
It preserves whitespace and newlines exactly.
\`\`\`

\`\`\`python
# This is a fenced code block with a language specified (python)
def hello_world():
    print("Hello, CommonMark!")

class MyClass:
    pass # Example class
\`\`\`

\`\`\`javascript
// Fenced code block for JavaScript
function calculate(a, b) {
  return a + b;
}
console.log(\`2 + 3 = \${calculate(2, 3)}\`);
\`\`\`

---

## 7. Blockquotes

> This is a blockquote.
> It can span multiple lines. The > character is needed at the start of each line.

> You can also be lazy and only put it on the first line of a paragraph.
This line is still part of the blockquote.

> Nested blockquotes:
>> This is nested.
>>> And even deeper.
>
> - Lists can be in blockquotes
> - Like this
>
> #### Headings too!
> And \`inline code\`.

---

## 8. Lists

### 8.1 Unordered Lists

* Item 1 (using asterisk)
* Item 2
    * Nested item 2.1 (indent by 2 or 4 spaces)
    * Nested item 2.2
        * Deeper nested item 2.2.1
- Item 3 (using hyphen)
  - Nested item 3.1
+ Item 4 (using plus)
  + Nested item 4.1

### 8.2 Ordered Lists

1. First item
2. Second item
   1. Sub-item A (numbering restarts for sublists)
   2. Sub-item B
3. Third item
   (Note: The actual numbers you use don't always matter for rendering, only the first one and that they are numbers followed by a period or parenthesis. The renderer usually fixes the sequence.)
99. Ninety-ninth item (will render as 4th in this sequence)
1) Item using parenthesis (less common)

### 8.3 Lists with Multiple Paragraphs or Other Blocks

*   This is the first paragraph of a list item.

    This is the second paragraph of the same list item.
    Must be indented to align with the text of the first paragraph.

*   \`\`\`python
    # Code block in a list item
    print("List item code")
    \`\`\`

*   > Blockquote in a list item.
    > Spanning multiple lines.

---

## 9. Links

### 9.1 Inline Links

[This is an inline link to CommonMark](https://commonmark.org "CommonMark Spec Home")
[Link with no title](https://www.example.com)

### 9.2 Reference-style Links

[This is a reference-style link][ref1].
[This is another one, with implicit name][CommonMark Spec].
You can define the reference [later in the document][ref2].
[This uses a collapsed reference][]. (The link text itself is the reference ID)

[ref1]: https://www.markdownguide.org "The Markdown Guide"
[CommonMark Spec]: https://spec.commonmark.org/
[ref2]: https://daringfireball.net/projects/markdown/ "Original Markdown by John Gruber"
[collapsed reference]: https://github.com/ "GitHub"

### 9.3 Autolinks

Plain URL: <https://www.example.com>
Email: <mailto:test@example.com>

---

## 10. Images

(Note: You'll need actual image URLs for these to display properly. Placeholder images are used here.)

### 10.1 Inline Images

![Alt text for an inline image](https://via.placeholder.com/150/0000FF/808080?Text=Inline+Image "Tooltip for inline image")

### 10.2 Reference-style Images

![Alt text for a reference image][imgref1]
![Another reference image][imgref2]

[imgref1]: https://via.placeholder.com/200x100/FF0000/FFFFFF?Text=Reference+Image+1 "Tooltip for reference image 1"
[imgref2]: https://via.placeholder.com/100x150/00FF00/000000?Text=Ref+Img+2 "Tooltip for reference image 2"

---

## 11. Horizontal Rules

A horizontal rule can be created by three or more hyphens, asterisks, or underscores on a line by themselves.

---

***

___

- - - (with spaces)

* * * (with spaces)

_ _ _ (with spaces)

---

## 12. Escaping Characters

To display literal characters that have special meaning in Markdown, use a backslash \`\\\` before them:

\\*Not italic\\*
\\_Not italic\\_
\\*\\*Not bold\\*\\*
\\_\\_Not bold\\_\\_
\\\`Not code\\\`
\\[Not a link text bracket]
\\(Not a link URL bracket)
\\# Not a heading
\\. Not an ordered list item start (e.g., 1\\. This is not a list)
\\!\\[Not an image alt text bracket]

This is a literal backslash: \\

---

## 13. Tables (GFM Extension)

Tables are a common extension, especially in GitHub Flavored Markdown.

| Header 1 | Header 2      | Header 3    |
| :------- | :-----------: | ----------: |
| Left     | Center-aligned| Right-aligned |
| Cell     | Cell content  | Cell        |
| Long cell content that might wrap or be truncated | Another cell | And another one |
| \`code\`   | *italic*      | **bold**    |

Minimum table:
| Head |
|------|
| Body |

---

## 14. HTML (Allowed in CommonMark)

CommonMark allows raw HTML to be embedded. However, its rendering can be controlled or stripped by the parser/renderer for security reasons.

This is <mark>highlighted HTML text</mark>.
This is <strong>strong HTML text</strong>.
This is <em>emphasized HTML text</em>.
This is <u>underlined HTML text</u>.
This is <sub>subscript</sub> and <sup>superscript</sup> text.
<font color="blue">This text is blue (using deprecated font tag).</font>
<span style="color: green; font-weight: bold;">This text is green and bold using inline CSS.</span>

<div>
  This is a div element.
  <p>With a paragraph inside.</p>
</div>

<!-- This is an HTML comment, usually not rendered -->

---
End of Test File.
`}
    />
  );
}
