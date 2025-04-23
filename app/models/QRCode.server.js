import db from '../db.server'

export async function getQRCode(id, graphql) {
    const qrCode = await db.findFirst({where: {id}})

    if(!qrCode) return null

    return supplimentQrCode(qrCode,graphql)
}