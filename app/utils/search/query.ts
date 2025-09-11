const getQuery = (term: string, limit = 30, offset = 0) => {
  return `{
            itemsBySearch(
            q: "${term}",
            limit: ${limit},
            offset: ${offset * limit}
            ) {
            items {
                itemId
                title
                itemWebUrl
                image {
                    imageUrl
                    height
                    width
                }
                price {
                    value
                    currency
                }
            }
            }
        }`;
};

export { getQuery };
