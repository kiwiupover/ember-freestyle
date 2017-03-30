import Ember from 'ember';
import md from 'markdown-it';
import highlight from 'highlight';

const {
  String: EmString,
  isEmpty
} = Ember;
const { htmlSafe } = EmString;

export function freestyleMarkdown(params/*, hash*/) {
  if (isEmpty(params)) {
    return;
  }

  let [markdown] = params;
  let html = md({
    highlight: function (str, lang) {
      if (lang && highlight.getLanguage(lang)) {
        // try {
          return '<pre class="hljs"><code>' +
            highlight.highlight(lang, str, true).value +
            '</code></pre>';
        // } catch (__) {

        //}
      }

      return '<pre class="hljs"><code>' + str + '</code></pre>';
    }
  }).render(markdown);

  return htmlSafe(html);
}

export default Ember.Helper.helper(freestyleMarkdown);
