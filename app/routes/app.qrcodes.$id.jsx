import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { getQRCode, validateQrCode } from "../models/QRCode.server";
import { authenticate } from "../shopify.server";
import { data,redirect } from "@remix-run/node";
import { useState } from "react";
import {
  Bleed,
  BlockStack,
  Button,
  Card,
  ChoiceList,
  Divider,
  EmptyState,
  InlineError,
  InlineStack,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);

  if (params.id == "new") {
    return data({
      destination: "product",
      title: "",
    });
  }

  return data(await getQRCode(Number(params.id), admin.graphql));
}

export async function action({ request, params }) {
    const {session} = await authenticate.admin(request)
    const {shop} = session

    const data = {...Object.fromEntries(await request.formData()), shop}
    if(data.action == 'delete') {
      await db.qRCode.delete({where: {id: Number(params.id)}})
      return redirect("/app")
    }

    const errors = validateQrCode(data)

    if(errors) {
      return data({errors}, {status: 422})
    }

    const qrCode = params.id == 'new' ? db.qRCode.create({data}) : db.qRCode.update({where: {id: Number(params.id)}, data})

    return redirect(`app/qrcodes/${qrCode.id}`)
  
}





export default function QRCodeForm() {
  const errors = useActionData()?.errors || {};
  const qrCode = useLoaderData();

  const [formState, setFormState] = useState(qrCode);
  const [cleanFormState, setCleanFormState] = useState(qrCode);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const nav = useNavigation();

  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") == "delete";

  const navigate = useNavigate();

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
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
    submit(data, { method: "POST" });
  };

  return (
    <Page>
      <ui-title-bar title={qrCode?.id ? "Edit QR code" : "Create New QR Code"}>
        <button onClick={navigate("/app")} variant="breadcrumb">
          QR codes
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingLg">
                  Title
                </Text>

                <TextField
                  id="title"
                  onChange={(title) => setFormState({ ...formState, title })}
                  label="title"
                  labelHidden
                  autoComplete="off"
                  value={formState?.title}
                  error={errors?.title}
                  helpText="Only store staff can see this title"
                />
              </BlockStack>
            </Card>
            <Card>
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Product
                </Text>
                {formState?.productId ? (
                  <Button onClick={selectProduct}>Change Product</Button>
                ) : null}
              </InlineStack>
              {formState?.productId ? (
                <InlineStack blockAlign="center" gap="500">
                  <Thumbnail
                    source={formState?.productImage || ImageIcon}
                    alt={formState?.productAlt}
                  />
                  <Text as="span" variant="headingMd" fontWeight="semibold">
                    {formState?.productTitle}
                  </Text>
                </InlineStack>
              ) : (
                <BlockStack gap="200">
                  <Button onClick={selectProduct} id="select-product">
                    Select Product
                  </Button>
                  {errors?.productId ? (
                    <InlineError
                      message={errors.productId}
                      fieldID="myFieldID"
                    />
                  ) : null}
                </BlockStack>
              )}
            </Card>
            <Bleed marginInlineStart="200" marginInlineEnd="200">
              <Divider />
            </Bleed>
            <InlineStack gap="500" align="space-between" blockAlign="start">
              <ChoiceList
                title="Scan Destination"
                choices={[
                  { label: "Link to product page", value: "product" },
                  {
                    label: "Link to checkout page with product in the cart",
                    value: "cart",
                  },
                ]}
                selected={[formState?.destination]}
                onChange={(destination) =>
                  setFormState({ ...formState, destination: destination[0] })
                }
                error={errors?.destination}
              />
              {qrCode?.destinationUrl ? (
                <Button
                  variant="plain"
                  url={qrCode?.destinationUrl}
                  target="_blank"
                >
                  Go to destination URL
                </Button>
              ) : null}
            </InlineStack>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <Text as="h2" variant="headingLg">
              QR Code
            </Text>
            {qrCode ? (
              <EmptyState imageContained={true} image={qrCode?.image} />
            ) : (
              <EmptyState>
                Your QR code will appear here after you save
              </EmptyState>
            )}
            <BlockStack gap="300">
              <Button
                disabled={!qrCode?.image}
                download
                url={qrCode?.image}
                variant="primary"
              >
                Download
              </Button>
              <Button
                disabled={!qrCode?.id}
                url={`/qrcodes/${qrCode?.id}`}
                target="_blank"
              >
                Go to public URL
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
            <PageActions
                primaryAction={{
                    content: "Save",
                    loading: isSaving,
                    disabled: !isDirty || isSaving || isDeleting,
                    onAction: handleSave
                }}
                secondaryActions={[
                    {
                        content: 'Delete',
                        loading: isDeleting,
                        disabled: !qrCode?.id || !qrCode || isSaving || isDeleting,
                        destructive: true,
                        outline: true,
                        onAction: () => submit({action: "delete"}, {method: "POST"})
                    }
                ]}
            />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
