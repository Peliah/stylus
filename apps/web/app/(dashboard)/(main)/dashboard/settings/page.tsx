import { getActiveVendor } from "@/lib/vendor"
import { getVendorConnectionStatus } from "@/lib/whatsapp-connection"
import { PageHeader } from "@/components/dashboard/page-header"
import { PhoneDisplay } from "@/components/dashboard/phone-display"
import { WhatsAppReconnectPanel } from "@/components/setup/whatsapp-reconnect-panel"
import { updateShopNameAction } from "./actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

export default async function SettingsPage() {
  const vendor = await getActiveVendor()
  const connection = await getVendorConnectionStatus(vendor)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage your shop and WhatsApp connection." />

      <Tabs defaultValue="shop">
        <TabsList>
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shop name</CardTitle>
              <CardDescription>Shown in customer messages and the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateShopNameAction}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input name="name" defaultValue={vendor.name} required />
                  </Field>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">WhatsApp connection</CardTitle>
              <CardDescription>
                {connection.connected ? (
                  <span className="text-emerald-600">Connected</span>
                ) : (
                  <span className="text-amber-600">Not connected</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm">
                Linked number: <PhoneDisplay phone={vendor.phoneNumber} />
              </p>
              {!connection.connected && (
                <WhatsAppReconnectPanel phone={vendor.phoneNumber.replace("@c.us", "")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Vendor phone: <PhoneDisplay phone={vendor.phoneNumber} />
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
