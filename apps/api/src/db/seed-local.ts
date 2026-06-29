import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const PASSWORD = "Password123";

const roles = [
  {
    key: "platform_owner",
    name: "Platform Owner",
    description: "Full Addressor platform control.",
  },
  {
    key: "platform_admin",
    name: "Platform Admin",
    description: "Platform management access.",
  },
  {
    key: "platform_support",
    name: "Platform Support",
    description: "Platform support access.",
  },
  {
    key: "customer",
    name: "Customer",
    description: "Customer discovery account.",
  },
];

async function upsertRole(
  client: pg.Client,
  role: { key: string; name: string; description: string },
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO roles (key, name, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (key)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
      RETURNING id
    `,
    [role.key, role.name, role.description],
  );

  return result.rows[0].id;
}

async function upsertUser(
  client: pg.Client,
  input: {
    email: string;
    fullName: string;
    passwordHash: string;
  },
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO users (
        email,
        full_name,
        password_hash,
        status,
        email_verified,
        phone_verified
      )
      VALUES ($1, $2, $3, 'active', true, true)
      ON CONFLICT (email)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        status = 'active',
        email_verified = true,
        phone_verified = true,
        updated_at = now()
      RETURNING id
    `,
    [input.email, input.fullName, input.passwordHash],
  );

  return result.rows[0].id;
}

async function attachRole(client: pg.Client, userId: string, roleId: string) {
  await client.query(
    `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id)
      DO NOTHING
    `,
    [userId, roleId],
  );
}

async function upsertBusiness(client: pg.Client, ownerUserId: string) {
  const business = await client.query<{ id: string }>(
    `
      INSERT INTO businesses (
        owner_user_id,
        legal_name,
        display_name,
        slug,
        category,
        short_description,
        phone,
        email,
        whatsapp_number,
        country,
        city,
        district,
        sector,
        address_line,
        verification_status,
        onboarding_status,
        subscription_status
      )
      VALUES (
        $1,
        'Addressor Test Business Ltd',
        'Addressor Test Business',
        'addressor-test-business',
        'restaurant',
        'Local test business for Addressor authentication and authorization.',
        '+250780000001',
        'businessowner@example.com',
        '+250780000001',
        'Rwanda',
        'Kigali',
        'Nyarugenge',
        'Kiyovu',
        'Kiyovu, Kigali',
        'approved',
        'completed',
        'free'
      )
      ON CONFLICT (slug)
      DO UPDATE SET
        owner_user_id = EXCLUDED.owner_user_id,
        display_name = EXCLUDED.display_name,
        category = EXCLUDED.category,
        verification_status = 'approved',
        onboarding_status = 'completed',
        updated_at = now()
      RETURNING id
    `,
    [ownerUserId],
  );

  const businessId = business.rows[0].id;

  const branch = await client.query<{ id: string }>(
    `
      INSERT INTO business_branches (
        business_id,
        name,
        slug,
        phone,
        email,
        whatsapp_number,
        country,
        city,
        district,
        sector,
        address_line,
        latitude,
        longitude,
        is_head_office,
        status
      )
      VALUES (
        $1,
        'Main Branch',
        'main-branch',
        '+250780000001',
        'businessowner@example.com',
        '+250780000001',
        'Rwanda',
        'Kigali',
        'Nyarugenge',
        'Kiyovu',
        'Kiyovu, Kigali',
        -1.9500,
        30.0600,
        true,
        'active'
      )
      ON CONFLICT (business_id, slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        whatsapp_number = EXCLUDED.whatsapp_number,
        city = EXCLUDED.city,
        district = EXCLUDED.district,
        sector = EXCLUDED.sector,
        address_line = EXCLUDED.address_line,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        is_head_office = true,
        status = 'active',
        updated_at = now()
      RETURNING id
    `,
    [businessId],
  );

  const branchId = branch.rows[0].id;

  await client.query(
    `
      INSERT INTO business_team_members (
        business_id,
        branch_id,
        user_id,
        role,
        status,
        joined_at
      )
      VALUES ($1, $2, $3, 'business_owner', 'active', now())
      ON CONFLICT (business_id, user_id, role)
      DO UPDATE SET
        branch_id = EXCLUDED.branch_id,
        status = 'active',
        joined_at = COALESCE(business_team_members.joined_at, now())
    `,
    [businessId, branchId, ownerUserId],
  );

  return { businessId, branchId };
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  await client.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const roleIds = new Map<string, string>();

    for (const role of roles) {
      roleIds.set(role.key, await upsertRole(client, role));
    }

    const customerId = await upsertUser(client, {
      email: "customer@example.com",
      fullName: "Addressor Customer",
      passwordHash,
    });

    const businessOwnerId = await upsertUser(client, {
      email: "businessowner@example.com",
      fullName: "Addressor Business Owner",
      passwordHash,
    });

    const platformOwnerId = await upsertUser(client, {
      email: "rurangwa.luke@gmail.com",
      fullName: "Luc Rurangwa",
      passwordHash,
    });

    await attachRole(client, customerId, roleIds.get("customer")!);
    await attachRole(client, platformOwnerId, roleIds.get("platform_owner")!);

    const business = await upsertBusiness(client, businessOwnerId);

    await client.query("COMMIT");

    console.log("Local Addressor seed completed.");
    console.table([
      {
        email: "customer@example.com",
        password: PASSWORD,
        access: "Customer",
      },
      {
        email: "businessowner@example.com",
        password: PASSWORD,
        access: "Business owner",
        businessId: business.businessId,
        branchId: business.branchId,
      },
      {
        email: "rurangwa.luke@gmail.com",
        password: PASSWORD,
        access: "Platform owner",
      },
    ]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});