import { NextResponse } from "next/server";

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(data, { status: 200, ...init });

export const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });
