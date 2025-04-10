import db from '../db.server'
import qrCode from 'qrcode'
import invariant from 'tiny-invariant'


export async function getQRCode(id, graphql) {
    const qrCode = await db.qrCode.findFirst({where: {id}})

    if(!qrCode) {
        return null
    }

    return supplimentQrCode(qrCode, graphql)
}

export async function getQRCodes(shop, graphql) {
    const qrCodes = await db.qrCode.findMany({
        where: {shop},
        orderBy: {id: "desc"}
    })

    if(qrCodes.length === 0) return []

    return Promise.all(qrCodes.map((qrCode) => supplimentQrCode(qrCode, graphql)))
}

export function getQRCodeImage(id) {
    const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL)
    return qrCode.toDataURL(url.href)
}

export function getDestinationUrl(qrCode) {
    if(qrCode.destination == 'product') {
        return `https://${qrCode.shop}/products/${qrCode.productHandle}`
    }
    const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(qrCode.productVariantId);
    invariant(match, "Unrecognized product variant ID");

  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

async function supplimentQrCode(qrCode, graphql) {
    const qrCodeImagePromise = getQRCodeImage(qrCode.id)

    const response = await graphql(
        `query supplimentQRCode($id: ID!) {
            product(id: $id) {
                title
                images(first: 1) {
                    nodes {
                        altText
                        url
                    }
                
                }
            
            }
        
        }
            `,
            // the id value is dynamically passed
            {
                variables: {
                    id: qrCode.productId
                }

            }
    );

    const {
        data: { product} // destructure and extract product from response structure
    } = await response.json

    return {
        ...qrCode,
        productDeleted: !product?.title,
        productTitle: product?.title,
        productImage: product?.images?.nodes[0].url,
        productAlt: product?.images?.nodes[0].alt,
        destinationUrl: getDestinationUrl(qrCode),
        image: await qrCodeImagePromise

    }
}

export function validateQRCode(data) {
    const errors = {}
    if(!data.title) {
        errors.title = 'Title is required!'
    }
    if(!data.productId) {
        errors.productId = 'Product is required'
    }
    if(!data.destination) {
        errors.destination = 'Destination is required'
    }

    if(Object.keys(errors).length) {
        return errors
    }
}