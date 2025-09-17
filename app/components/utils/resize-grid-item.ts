const gridAutoRows = 2;

function resizeGridItem(item: HTMLElement) {
  const content = item.firstElementChild;
  if (!content) return;

  const gridRowEnd = Math.ceil(
    content.getBoundingClientRect().height / gridAutoRows
  );

  item.style.gridRowEnd = "span " + gridRowEnd;
}

export { resizeGridItem };
