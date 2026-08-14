import { list, get, put } from "@vercel/blob";
import { storageMode } from "@/lib/store";

/**
 * 저장소 진단용 임시 엔드포인트.
 * 파티가 사라지는 원인(쓰기 유실 vs 읽기 실패)을 구분하기 위해
 * 스토어에 실제로 남아 있는 객체 목록과 왕복 결과를 함께 반환한다.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const probeId = url.searchParams.get("id");

  const out: Record<string, unknown> = {
    storageMode,
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasPostgres: Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL),
    region: process.env.VERCEL_REGION ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  };

  if (storageMode !== "blob") return Response.json(out);

  try {
    const listed = await list({ prefix: "party/", limit: 100 });
    out.partyCount = listed.blobs.length;
    out.partyPathnames = listed.blobs.map((b) => b.pathname).slice(0, 40);
  } catch (e) {
    out.listError = e instanceof Error ? e.message : String(e);
  }

  if (probeId) {
    const pathname = `party/${probeId}.json`;
    try {
      const nocache = await get(pathname, { access: "private", useCache: false });
      out.probeNoCache = nocache?.statusCode ?? null;
    } catch (e) {
      out.probeNoCacheError = e instanceof Error ? e.message : String(e);
    }
    try {
      const cached = await get(pathname, { access: "private" });
      out.probeCached = cached?.statusCode ?? null;
    } catch (e) {
      out.probeCachedError = e instanceof Error ? e.message : String(e);
    }
  }

  // 쓰기 → 즉시 읽기 왕복 (지연 측정)
  const rtPath = `diag/roundtrip.json`;
  const payload = JSON.stringify({ at: new Date().toISOString() });
  try {
    const started = Date.now();
    await put(rtPath, payload, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    out.putMs = Date.now() - started;

    let readableAfterMs: number | null = null;
    for (let i = 0; i < 20; i++) {
      const r = await get(rtPath, { access: "private", useCache: false });
      if (r?.statusCode === 200) {
        const text = await new Response(r.stream).text();
        if (text === payload) {
          readableAfterMs = Date.now() - started;
          break;
        }
      }
      await new Promise((res) => setTimeout(res, 100));
    }
    out.roundtripReadableAfterMs = readableAfterMs;
  } catch (e) {
    out.roundtripError = e instanceof Error ? e.message : String(e);
  }

  return Response.json(out);
}
