// Renders a conversation view (game/dialogue.js) as HTML over the canvas: crisp at any
// scale, with real buttons and a live region so screen readers get the dialogue too.
// Call the returned render function every frame with a view, or null to hide.
export function createTextbox(root, { onTap, onChoose, onPoint }) {
  root.innerHTML = `
    <div class="box choices" hidden><ul></ul></div>
    <div class="box textbox" hidden>
      <span class="speaker band"></span>
      <p class="text" aria-hidden="true"></p>
      <span class="more" aria-hidden="true">▼</span>
    </div>
    <p class="visually-hidden" aria-live="polite"></p>`;
  const [choicesBox, textbox, live] = root.children;
  const list = choicesBox.querySelector('ul');
  const speaker = textbox.querySelector('.speaker');
  const text = textbox.querySelector('.text');
  const more = textbox.querySelector('.more');

  textbox.addEventListener('click', onTap);
  list.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) onChoose(Number(button.dataset.index));
  });
  list.addEventListener('pointermove', (event) => {
    const button = event.target.closest('button');
    if (button) onPoint(Number(button.dataset.index));
  });

  let shownPage = null;
  let shownChoices = null;

  return function render(view) {
    textbox.hidden = !view;
    choicesBox.hidden = !view?.choices;
    if (!view) {
      shownPage = shownChoices = null;
      return;
    }

    if (view.pageKey !== shownPage) {
      shownPage = view.pageKey;
      shownChoices = null;
      speaker.textContent = view.speaker ?? '';
      speaker.hidden = !view.speaker;
      // Every word is laid out up front and revealed in place, so lines never re-wrap.
      // `_a phrase_` is underlined, spaces inside it too.
      let marked = false;
      text.replaceChildren(
        ...view.words.flatMap((word) => {
          const span = document.createElement('span');
          if (word.startsWith('_')) marked = true;
          span.classList.toggle('marked', marked);
          span.textContent = word.replace(/^_|_(?=\W*$)/g, '');
          if (/_\W*$/.test(word)) marked = false;
          if (!marked) return [span, ' '];
          span.textContent += ' ';
          return [span];
        }),
      );
      const line = view.words.join(' ').replaceAll('_', '');
      live.textContent = view.speaker ? `${view.speaker}: ${line}` : line;
    }
    [...text.children].forEach((span, i) => span.classList.toggle('unrevealed', i >= view.revealed));
    more.hidden = !view.waiting;

    if (!view.choices) return;
    if (shownChoices !== shownPage) {
      shownChoices = shownPage;
      list.replaceChildren(
        ...view.choices.map((label, i) => {
          const item = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.index = i;
          button.textContent = label;
          item.append(button);
          return item;
        }),
      );
    }
    [...list.querySelectorAll('button')].forEach((button, i) =>
      button.classList.toggle('selected', i === view.selected),
    );
  };
}
