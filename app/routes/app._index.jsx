import {AlertDiamondIcon, ImageIcon} from '@shopify/polaris-icons'
import { authenticate } from '../shopify.server';
import { getQRCodes } from '../models/QRCode.server';
import { json } from '@remix-run/node';
import { EmptyState, Icon, IndexTable, InlineStack, Thumbnail, Text, Page, Button, Layout, Card } from '@shopify/polaris';
import {Link, useLoaderData, useNavigate} from '@remix-run/react'


export async function loader({request}) {
  const {admin,session} = await authenticate.admin(request)
  const qrCodes = await getQRCodes(session.shop, admin.graphql)

  return json({
    qrCodes
  })
}

const EmptyQRCodes = ({onAction}) => (
  <EmptyState
    heading='Create unique QR codes for your product'
    action={{
      content: 'Creat QR code',
      onAction
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow customers to scan codes and buy products using their phones</p>
  </EmptyState>
)

const QrTable = ({qrCodes}) => (
  <IndexTable
    resourceName={{
      singular: 'QR Code',
      plural: 'QR code'
    }}
    itemCount={qrCodes.length}
    headings={[
      {title: 'Thumbnail', hidden: true},
      {title: 'Title'},
      {title: 'Product'},
      {title: 'Date Created'},
      {title: 'Scans'}
    ]}
    selectable={false}
  >
    {qrCodes.map((qrCode) => (
      <QRTableRow key={qrCode.id} qrCode={qrCode}/>
    ))}
  </IndexTable>
)

function truncate(str, {length = 25}={}) {
  if(!str) return ''
  if(str.length < length) return str
  return str.slice(0, length) + '...'
}

const QRTableRow = ({qrCode}) => (
  <IndexTable.Row id={qrCode.id} position={qrCode.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={qrCode?.productImage || ImageIcon}
        alt={qrCode?.productTitle}
        size='small'
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`/app/qrcodes/${qrCode.id}`}>{truncate(qrCode?.productTitle)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {qrCode?.productDeleted ? (<InlineStack align='start' gap="200">
        <span style={{width: "20px"}}><Icon source={AlertDiamondIcon} tone='critical'/></span>
        <Text tone="critical" as="span">product has been deleted</Text>
      </InlineStack>) : (truncate(qrCode?.productTitle))}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(qrCode.createdAt).toDateString()}
    </IndexTable.Cell>
    <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
  </IndexTable.Row>
)

export default function Index() {
  const navigate = useNavigate()
  const {qrCodes} = useLoaderData()

  

  return (
    <Page> 
      <ui-title-bar title='QR Codes'><button onClick={() => navigate("/app/qrcodes/new")} variant='primary'>Create QR Code</button></ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding='0'>
            {qrCodes.length === 0 ? (
              <EmptyQRCodes onAction={() => navigate('qrcodes/new')}/>
            ) : (
              <QrTable qrCodes={qrCodes}/>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
