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

  async function selectProduct() {
    const product = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
    });
  }

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

    submit(data, { method: "POST" });
  };

  return (
    <>
      <Page>
        <ui-title-bar title={qrCode.id ? "Edit QR Code" : "Create New QR Code"}>
          <button onClick={navigate("/app")} variant="breadcrumb">
            QR Codes
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
                    label="title"
                    helpText="Only store staff can see the title"
                    labelHidden
                    autoComplete="off"
                    value={formState.title}
                    onChange={() => setFormState({ ...formState, title })}
                    error={errors.title}
                  />
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="500">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingLg">
                      Product
                    </Text>

                    {formState.productId ? (
                      <Button variant="plain" onClick={selectProduct}>
                        Change Product
                      </Button>
                    ) : null}
                  </InlineStack>
                  {formState.productId ? (
                    <InlineStack>
                      <Thumbnail
                        source={formState.productImage || ImageIcon}
                        alt={formState.productAlt}
                      />
                      <Text as="span" variant="headingMd" fontWeight="semibold">
                        {formState.productTitle}
                      </Text>
                    </InlineStack>
                  ) : (
                    <BlockStack gap="500">
                      <Button variant="plain" onClick={selectProduct}>
                        Select Product
                      </Button>
                      {errors.productId && (
                        <InlineError
                          message={errors.productId}
                          fieldID="myFieldID"
                        />
                      )}
                    </BlockStack>
                  )}
                  <Bleed marginInlineStart="200" marginInlineEnd="200">
                    <Divider />
                  </Bleed>
                  <InlineStack
                    gap="500"
                    align="space-between"
                    blockAlign="start"
                  >
                    <ChoiceList
                      title="Scan Destination"
                      choices={[
                        {
                          label: "Link to product page",
                          value: "product",
                        },
                        {
                          label:
                            "Link to checkout page with product in the cart",
                          value: "cart",
                        },
                      ]}
                      selected={formState.destination}
                      onChange={(destination) =>
                        setFormState({
                          ...formState,
                          destination: destination[0],
                        })
                      }
                      error={errors.destination}
                    />
                    {qrCode.destinationUrl && (
                      <Button
                        variant="plain"
                        url={qrCode.destinationUrl}
                        target="_blank"
                      >
                        Go to destination URL
                      </Button>
                    )}
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <Text as="h2" variant="headingLg">
                QR Code
              </Text>
              {qrCode ? (
                <EmptyState
                  image={qrCode.image}
                  imageContained={true}
                ></EmptyState>
              ) : (
                <EmptyState image="">
                  Your QR code will appear here after you save
                </EmptyState>
              )}
              <BlockStack gap="300">
                <Button
                  disabled={!qrCode?.image}
                  url={qrCode?.image}
                  download
                  variant="primary"
                >
                  Download
                </Button>
                <Button
                  disabled={!qrCode.id}
                  url={`/qrcodes/${qrCode.id}`}
                  target="_blank"
                >
                  Go to public URL
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <PageActions
              secondaryActions={[
                {
                  content:"Delete",
                  loading: isDeleting,
                  disabled: !qrCode.id || !qrCode || isSaving || isDeleting,
                  destructive: true,
                  outline: true,
                  onAction: () => submit({action: "delete"}, {method: "POST"})
                }
              ]}
              primaryAction = {{
                
                  content: "Save",
                  loading: isSaving,
                  disabled: !isDirty || isSaving || isDeleting,
                  onAction: handleSave
                
              }}
            />
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
