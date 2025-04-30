import { useActionData, useLoaderData, useNavigation } from '@remix-run/react'
import { getQRCode } from '../models/QRCode.server'
import {authenticate} from '../shopify.server'
import {data} from '@remix-run/node'
import { useState } from 'react'

export async function loader({request, params}) {
    const {admin} = await authenticate.admin(request)

    if(params.id == 'new') {
        return data({
            destination: "product",
            title: ""
        })
    }

    return data(await getQRCode(Number(params.id), admin.graphql))
}

export default function QRCodeForm() {
    const errors = useActionData()?.errors || {}
    const qrCode = useLoaderData()

    const [formState, setFormState] = useState(qrCode)
    const [cleanFormState, setCleanFormState] = useState(qrCode)
    const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState)
    const nav = useNavigation()
    
}