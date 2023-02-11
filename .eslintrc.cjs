module.exports = {
  env: {
    node: true,
  },
  plugins: ["@typescript-eslint", "jest"],
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "no-console": 0,

    "accessor-pairs": [
      2,
      {
        getWithoutSet: true,
      },
    ],
    "default-case": 2,
    "dot-notation": [
      2,
      {
        allowKeywords: true,
        allowPattern: "^[a-z]+(_[a-z]+)+$",
      },
    ],
    eqeqeq: ["error", "always", { null: "ignore" }],
    "guard-for-in": 2,
    "no-alert": 2,
    "no-caller": 2,
    "no-div-regex": 2,
    "no-eval": 2,
    "no-extra-bind": 2,
    "no-implicit-coercion": [
      2,
      {
        boolean: true,
        number: true,
        string: true,
      },
    ],
    "no-implied-eval": 2,
    "no-invalid-this": 2,
    "no-iterator": 2,
    "no-lone-blocks": 2,
    "no-loop-func": 2,
    "no-multi-str": 2,
    "no-native-reassign": [
      2,
      {
        exceptions: [],
      },
    ],
    "no-new-func": 2,
    "no-new-wrappers": 2,
    "no-new": 2,
    "no-octal-escape": 2,
    "no-proto": 2,
    "no-return-assign": [2, "except-parens"],
    "no-script-url": 2,
    "no-self-compare": 2,
    "no-sequences": 2,
    "no-throw-literal": 2,
    "no-unused-expressions": [
      2,
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],
    "no-useless-call": 2,
    "no-useless-concat": 2,
    "no-void": 2,
    "no-warning-comments": [
      2,
      {
        terms: ["todo", "fixme", "xxx"],
        location: "anywhere",
      },
    ],
    radix: [2, "always"],
    yoda: [
      2,
      "never",
      {
        exceptRange: false,
        onlyEquality: false,
      },
    ],

    "init-declarations": [2, "always"],
    "no-catch-shadow": 2,
    "no-label-var": 2,
    "no-shadow": 2,
    "no-shadow-restricted-names": 2,
    "no-undef-init": 2,

    "callback-return": [2, ["callback", "cb", "next"]],
    "global-require": 2,
    "handle-callback-err": [2, "^(err|error)$"],
    "no-new-require": 2,
    "no-path-concat": 2,
    "no-process-exit": 2,
    "no-sync": 2,

    "consistent-this": [2, "that"],
    "func-style": [
      2,
      "declaration",
      {
        allowArrowFunctions: false,
      },
    ],
    "max-nested-callbacks": [2, 5],
    "no-array-constructor": 2,
    "no-lonely-if": 2,
    "no-negated-condition": 2,
    "no-nested-ternary": 2,
    "no-new-object": 2,
    "no-underscore-dangle": [
      2,
      {
        allow: [],
      },
    ],
    "no-unneeded-ternary": 2,
    "operator-assignment": [2, "always"],
    "spaced-comment": [2, "always"],

    "arrow-body-style": [2, "as-needed"],
    "object-shorthand": [2, "properties"],
    "prefer-arrow-callback": 2,
    "prefer-const": 2,
    "prefer-spread": 2,
    "prefer-template": 2,
    "consistent-return": "error",
  },

  overrides: [
    {
      files: ["test/**"],
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
    },
  ],
};
