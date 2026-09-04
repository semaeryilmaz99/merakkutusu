import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // mongodb-memory-server ilk çalıştırmada mongod binary'sini indirebilir
    // (birkaç MB, birkaç saniye sürebilir) — varsayılan 10sn'lik hook timeout'u
    // bu yüzden yetersiz kalabiliyor.
    hookTimeout: 60000
  }
});
