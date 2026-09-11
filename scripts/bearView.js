function createBearElement(bear) {
    const bearElement = document.createElement('div');
    bearElement.className = 'bear';
    const image = document.createElement('img');
    image.src = bear.image;
    image.alt = 'Image of ' + bear.name;
    image.className = 'bear-image';
    const nameParagraph = document.createElement('p');
    const name = document.createElement('b');
    name.textContent = bear.name;
    nameParagraph.append(name, ' (' + bear.binomial + ')');
    const rangeParagraph = document.createElement('p');
    rangeParagraph.textContent = 'Range: ' + bear.range;
    bearElement.append(image, nameParagraph, rangeParagraph);
    return bearElement;
}

export function renderBears(bears) {
    const bearList = document.querySelector('.bear-list');
    const fragment = document.createDocumentFragment();
    bears.forEach((bear) => {
        fragment.append(createBearElement(bear));
    });

    bearList.replaceChildren(fragment);
}

export function renderBearError(message) {
    const bearList = document.querySelector('.bear-list');
    const errorMessage = document.createElement('p');
    errorMessage.className = 'bear-error';
    errorMessage.textContent = message;
    bearList.replaceChildren(errorMessage);
}