import { z } from "zod";

const EbayImage = z.object({
  imageUrl: z.url(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

const EbayPrice = z.object({
  value: z.number(),
  currency: z.string(),
});

const EbayItemSchema = z.object({
  itemId: z.string(),
  title: z.string(),
  itemWebUrl: z.string(),
  image: EbayImage.nullable(),
  price: EbayPrice,
});

const EbayImageSearchResults = z.object({
  data: z.object({
    itemsByImageSearch: z.object({
      items: z.array(EbayItemSchema).nullable(),
    }),
  }),
});

const EbayTextSearchResults = z.object({
  data: z.object({
    itemsBySearch: z.object({
      items: z.array(EbayItemSchema).nullable(),
    }),
  }),
});

export { EbayImageSearchResults, EbayTextSearchResults, EbayItemSchema };
