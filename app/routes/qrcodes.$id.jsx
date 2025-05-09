import { data } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getQRCodeImage } from "../models/QRCode.server";
import { useLoaderData } from "@remix-run/react";

export async function loader({params}) {
    invariant(params.id,'Could not find qrCode destination')
    const id = Number(params.id)
    const qrCode = await db.qRCode.findFirst({where: {id}})
    invariant(qrCode, 'Could not find qrCode destination')

    return data({
        title: qrCode?.title,
        image: await getQRCodeImage(id)
    })
}

export default function QRCode() {
    const {title, image} = useLoaderData()
    return (
        <>
            <h1>{title}</h1>
            <img src={image} alt="QR Code Image"/>
        </>
    )
}