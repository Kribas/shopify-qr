import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from '@remix-run/react'
import { getQRCode } from '../models/QRCode.server'
import {authenticate} from '../shopify.server'
import {data} from '@remix-run/node'
import { useState } from 'react'
import { Button, Page } from '@shopify/polaris'

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

    const isSaving = nav.state === 'submitting' && nav.formData?.get('action') !== 'delete'
    const isDeleting = nav.state === "submitting" && nav.formData?.get('action') == 'delete'

    const navigate = useNavigate()

    async function selectProduct() {
        const products = await window.shopify.resourcePicker({
            type: 'product',
            action: 'select'
        })

        if(products) {
            const {images,id,variants, title, handle} = products[0]

            setFormState({
                ...formState,
                productId: id,
                productVariantId: variants[0].id,
                productTitle: title,
                productHandle: handle,
                productAlt: images[0]?.altText,
                productImage: images[0]?.originalSrc
            })
         
        }
    }

    const submit = useSubmit()

    const handleSave = () => {
        const data = {
            title: formState.title,
            productId: formState.productId || "",
            productVariantId: formState.productVariantId || "",
            productHandle: formState.productHandle || "",
            destination: formState.destination
        }
        setCleanFormState({formState})
        submit(data, {method: "POST"})
    }

    return (
        <Page>
            <ui-title-bar title={qrCode?.id ? "Edit QR code" : "Create New QR Code"}>
                <button onClick={navigate("/app")} variant='breadcrumb'>QR codes</button>
            </ui-title-bar>
        </Page>
    )
    
}