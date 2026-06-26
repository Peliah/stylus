/**
 * Executes database operations (orders, stock reduction) inside transactional locks.
 * Performs transactions with row locking, locking the product row to prevent inventory
 * race conditions, decrementing stock in the database, and creating the Order record.
 */
import { prisma } from '../../../lib/prisma';
import { sendMessage } from '../../../lib/openwa';
import { getOrCreateDefaultVendor, VENDOR_PHONE_NUMBER } from './db';

export async function executeApprovedActions(suggestion: any) {
  const actions = suggestion.proposedActions as any;
  if (!actions || !Array.isArray(actions)) return;

  const vendor = await getOrCreateDefaultVendor();
  const customer = await prisma.customer.findFirst({
    where: {
      vendorId: vendor.id,
      phoneNumber: suggestion.customerPhoneNumber,
    },
  });

  if (!customer) {
    console.error(`Customer ${suggestion.customerPhoneNumber} not found during action execution`);
    return;
  }

  for (const action of actions) {
    if (action.type === 'CREATE_ORDER' && action.items) {
      await prisma.$transaction(async (tx: any) => {
        let orderTotal = 0;
        const orderItemsToCreate = [];

        for (const item of action.items) {
          const [product] = await tx.$queryRaw<any[]>`
            SELECT * FROM "Product"
            WHERE "vendorId" = ${vendor.id} AND "name" = ${item.productName}
            FOR UPDATE
          `;

          if (!product) {
            throw new Error(`Product "${item.productName}" not found in catalog.`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.productName}". Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          await tx.product.update({
            where: { id: product.id },
            data: { stock: product.stock - item.quantity },
          });

          orderTotal += product.price * item.quantity;
          orderItemsToCreate.push({
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
          });
        }

        const order = await tx.order.create({
          data: {
            vendorId: vendor.id,
            customerId: customer.id,
            status: 'PENDING',
            totalPrice: orderTotal,
            items: {
              create: orderItemsToCreate,
            },
          },
        });

        console.log(`[DB] Order ${order.id} created successfully for customer ${customer.phoneNumber}`);
      }).catch(async (error: any) => {
        console.error('[DB Transaction Failed]', error.message);
        await sendMessage(VENDOR_PHONE_NUMBER, `Failed to execute action: ${error.message}`);
      });
    }
  }
}
