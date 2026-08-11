import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 다국어 계층은 걷어냈다. 화면 문구는 코드에 직접 한국어로 적는다.
  // (배경은 CONTRIBUTING.md 의 "화면 문구는 코드에 직접 적습니다" 참고)
  {
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/i18n/*", "**/i18n/*"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='t']",
          message: "다국어 계층은 제거됐습니다. 한국어 문구를 그 자리에 직접 적으세요.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
