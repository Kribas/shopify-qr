import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getDestinationUrl } from "../models/QRCode.server";
import db from "../db.server";



export async function loader({params}) {
    invariant(params.id, 'Could not find QR Code destination')
    
    const id = Number(params.id)
    const qrCode = await db.qRCode.findFirsr({where: {id}})

    invariant(qrCode, 'Could not find QR Code destination')

    await db.qRCode.update({
        where: {id},
        data: {scans: {increment: 1}}
    })

    return redirect(getDestinationUrl(qrCode))
}