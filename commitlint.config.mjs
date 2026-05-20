export default {
    extends: ['@commitlint/config-conventional'],
    parserPreset: {
        parserOpts: {
          // 1. THE MAGIC REGEX
          // Checks for: "TICKET: type(scope): subject"
          // breakdown:  (Ticket) :  (Type)  (Scope?) : (Subject)
          headerPattern: /^(?:([A-Z]+-\d+):\s+)?(\w+)(?:\(([\w$.\-*/ ]*)\))?:\s+(.*)$/,          
          // 2. MAPPING
          // We tell Commitlint: "The first part is the reference, second is type..."
          headerCorrespondence: ['references', 'type', 'scope', 'subject'],
        },
    },
    rules: {
        // Optional: You can customize rules here
        'type-empty': [2, 'never'], 
        'type-enum': [2,'always', ['feat','fix','docs','style','refactor','perf','test','build','ci','chore','revert']],
        'subject-case': [2,'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
        'scope-empty': [0, 'never'],
        'subject-empty': [2, 'never'],
        'header-max-length': [2, 'always', 50],
    },
  }
