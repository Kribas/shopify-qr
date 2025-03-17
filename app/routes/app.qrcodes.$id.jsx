import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getQRCode } from "../models/QRCode.server";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request); // if the user is authenticated, then the method returns an admin object if not, then it handles the necessasry redirects

  if (params.id == "new") {
    return json({
      destination: "product",
      title: "",
    });
  }

  return json(await getQRCode(Number(params.id), admin.graphql));
}

export default function QRCodeForm() {
  const errors = useActionData()?.errors || {};
  const qrCode = useLoaderData();
  const [formState, setFormState] = useState(qrCode);
  const [cleanFormState, setCleanFormState] = useState(qrCode);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();

  const isSaving =
    nav.state == "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state == "submitting" && nav.formData?.get("action") == "delete";

  const navigate = useNavigate();

  const products = window.shopify.resourcePicker({
    type: "product",
    action: "select",
  });

  if (products) {
    const { images, id, variants, title, handle } = products[0];

    setFormState({
      ...formState,
      productId: id,
      productVariantId: variants[0].id,
      productTitle: title,
      productHandle: handle,
      productAlt: images[0]?.altText,
      productImage: images[0]?.originalSrc,
    });
  }

  const submit = useSubmit();

  const handleSave = () => {
    const data = {
      title: formState.title,
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      destination: formState.destination,
    };
    setCleanFormState({ ...formState });

    submit(data, {method: "POST"})
  };

  return (
    <>
    </>
  )
}
