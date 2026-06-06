import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET =
  process.env.JWT_SECRET || "insufarma-secret-key-change-in-prod";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): {
  id: string;
  role: string;
  email: string;
} {
  return jwt.verify(token, SECRET) as {
    id: string;
    role: string;
    email: string;
  };
}
