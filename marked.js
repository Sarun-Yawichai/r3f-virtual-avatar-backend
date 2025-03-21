import { readFile } from 'fs';
import { marked } from 'marked';
import removeMarkdown from "remove-markdown";

// Path to your Markdown file
const markdownFile = 'example.md';

// Read the Markdown file
readFile(markdownFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Convert Markdown to HTML
  const html = marked(data);
  const text = removeMarkdown(data, {
    useImgAltText: false
  });

  // Output the HTML
  console.log(html);
  console.log(text);
});
