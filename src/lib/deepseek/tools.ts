import type OpenAI from 'openai'

export const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Catat transaksi keuangan baru (pemasukan atau pengeluaran)',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Jumlah dalam rupiah (angka bulat)' },
          type: { type: 'string', enum: ['income', 'expense'], description: 'Jenis transaksi' },
          category: { type: 'string', description: 'Kategori transaksi' },
          note: { type: 'string', description: 'Catatan tambahan (opsional)' },
          date: { type: 'string', description: 'Tanggal format YYYY-MM-DD, default hari ini' },
        },
        required: ['amount', 'type', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_transaction',
      description: 'Edit/ubah transaksi yang sudah ada berdasarkan ID-nya',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID transaksi yang ingin diubah' },
          amount: { type: 'number', description: 'Jumlah baru dalam rupiah (opsional)' },
          type: { type: 'string', enum: ['income', 'expense'], description: 'Jenis baru (opsional)' },
          category: { type: 'string', description: 'Kategori baru (opsional)' },
          note: { type: 'string', description: 'Catatan baru (opsional)' },
          date: { type: 'string', description: 'Tanggal baru format YYYY-MM-DD (opsional)' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: 'Hapus transaksi yang sudah ada berdasarkan ID-nya',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID transaksi yang ingin dihapus' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_summary',
      description: 'Dapatkan ringkasan keuangan (total pemasukan, pengeluaran, dan saldo)',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            description: 'Periode rekap keuangan',
          },
          type: {
            type: 'string',
            enum: ['income', 'expense', 'all'],
            description: 'Filter jenis transaksi',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_transactions',
      description: 'Ambil daftar transaksi keuangan user',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Jumlah transaksi yang diambil, default 10' },
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            description: 'Filter periode',
          },
          category: { type: 'string', description: 'Filter kategori (opsional)' },
          type: { type: 'string', enum: ['income', 'expense'], description: 'Filter jenis' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_budget',
      description: 'Set atau update batas anggaran untuk kategori tertentu',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Kategori anggaran' },
          limit_amount: { type: 'number', description: 'Batas anggaran dalam rupiah' },
          month: { type: 'string', description: 'Bulan format YYYY-MM, default bulan ini' },
        },
        required: ['category', 'limit_amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budgets',
      description: 'Lihat anggaran dan realisasi pengeluaran per kategori',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Bulan format YYYY-MM, default bulan ini' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_goal',
      description: 'Buat target tabungan baru',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nama target tabungan' },
          target_amount: { type: 'number', description: 'Jumlah target dalam rupiah' },
          deadline: { type: 'string', description: 'Deadline format YYYY-MM-DD (opsional)' },
        },
        required: ['name', 'target_amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deposit_goal',
      description: 'Setor dana ke target tabungan tertentu',
      parameters: {
        type: 'object',
        properties: {
          goal_name: { type: 'string', description: 'Nama target tabungan' },
          amount: { type: 'number', description: 'Jumlah yang disetor dalam rupiah' },
        },
        required: ['goal_name', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_goals',
      description: 'Lihat semua target tabungan dan progresnya',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_debt',
      description: 'Catat hutang atau piutang',
      parameters: {
        type: 'object',
        properties: {
          person: { type: 'string', description: 'Nama orang terkait hutang/piutang' },
          amount: { type: 'number', description: 'Jumlah dalam rupiah' },
          type: {
            type: 'string',
            enum: ['owe', 'lent'],
            description: 'owe = kamu berhutang, lent = kamu meminjamkan',
          },
          note: { type: 'string', description: 'Keterangan (opsional)' },
        },
        required: ['person', 'amount', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'settle_debt',
      description: 'Tandai hutang/piutang sebagai lunas',
      parameters: {
        type: 'object',
        properties: {
          person: { type: 'string', description: 'Nama orang yang hutangnya dilunasi' },
        },
        required: ['person'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_debts',
      description: 'Lihat daftar hutang dan piutang',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['owe', 'lent', 'all'],
            description: 'Filter jenis: owe=hutangmu, lent=piutangmu',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_insights',
      description: 'Dapatkan analisis dan insight pola pengeluaran user',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month'],
            description: 'Periode analisis',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigasi ke halaman tertentu di aplikasi',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: ['/chat', '/dashboard', '/transactions', '/budgets', '/goals', '/debts', '/profile'],
            description: 'Halaman tujuan',
          },
        },
        required: ['page'],
      },
    },
  },
]
