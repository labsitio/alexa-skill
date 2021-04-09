/**
 * Função para retornar uma frase aleatória de um array de strings.
 *
 * @param array
 * @return string
 */
const randomPhrase = (array) => {
    const i = Math.floor(Math.random() * array.length);

    return(array[i]);
};

const removeAccents = (word) => {
    return word.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

const getMessageFromArray = (name, messages) => {
    const splitName = removeAccents(name.toUpperCase()).split(' '); 
    const firstSplitName = splitName[0];
    const lastSplitName = splitName[splitName.length - 1];

    const message = messages.find((item) => {
        const itemNameSplit = removeAccents(item.nome.toUpperCase()).split(' ');
        const firstItemNameSplit = itemNameSplit[0];
        const lastItemNameSplit = itemNameSplit[itemNameSplit.length - 1];
            
        return firstItemNameSplit === firstSplitName && lastItemNameSplit === lastSplitName;
    });
    
    return message;
}

const getRemoteData = (url) => new Promise((resolve, reject) => {
  const client = url.startsWith('https') ? require('https') : require('http');

  const request = client.get(url, (response) => {
    if (response.statusCode < 200 || response.statusCode > 299) {
      reject(new Error(`Failed with status code: ${response.statusCode}`));
    }
    
    const body = [];
    
    response.on('data', (chunk) => body.push(chunk));
    response.on('end', () => resolve(body.join('')));
  });

  request.on('error', (err) => reject(err));

});

module.exports = {
    randomPhrase,
    removeAccents,
    getMessageFromArray,
    getRemoteData,
};
