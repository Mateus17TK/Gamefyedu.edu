import { Activity, ClassRoom, Member, Result, User } from '../types';

const DB_NAME = 'gamify_edu_db';
const DB_VERSION = 1;
const STORES = ['users', 'classes', 'members', 'activities', 'results'] as const;
type StoreName = (typeof STORES)[number];

class DatabaseService {
  private db: IDBDatabase | null = null;
  private mode: 'idb' | 'storage' = 'idb';

  public async init(): Promise<void> {
    try {
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported');
      }

      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          STORES.forEach(store => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: 'id' });
            }
          });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('IndexedDB blocked'));
      });
    } catch {
      this.mode = 'storage';
    }

    // Check if initial seeding is needed
    const users = await this.getAll<User>('users');
    if (users.length === 0) {
      await this.seedInitialData();
    }
  }

  private async tx<T>(storeName: StoreName, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('DB not initialized'));
      }
      const t = this.db.transaction(storeName, mode);
      const req = callback(t.objectStore(storeName));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
    });
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    if (this.mode === 'idb' && this.db) {
      return this.tx<T[]>(storeName, 'readonly', store => store.getAll());
    }
    try {
      const raw = localStorage.getItem(`ge_store_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async put<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
    if (this.mode === 'idb' && this.db) {
      await this.tx(storeName, 'readwrite', store => store.put(item));
      return;
    }
    const all = await this.getAll<T>(storeName);
    const index = all.findIndex(x => x.id === item.id);
    if (index >= 0) {
      all[index] = item;
    } else {
      all.push(item);
    }
    try {
      localStorage.setItem(`ge_store_${storeName}`, JSON.stringify(all));
    } catch {
      // Storage quota exceeded fallback
    }
  }

  public async delete(storeName: StoreName, id: string): Promise<void> {
    if (this.mode === 'idb' && this.db) {
      await this.tx(storeName, 'readwrite', store => store.delete(id));
      return;
    }
    const all = await this.getAll<{ id: string }>(storeName);
    const filtered = all.filter(x => x.id !== id);
    try {
      localStorage.setItem(`ge_store_${storeName}`, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }

  public async hashPassword(password: string, salt: string): Promise<string> {
    const combined = salt + password;
    if (window.crypto && crypto.subtle) {
      const buf = new TextEncoder().encode(combined);
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return btoa(unescape(encodeURIComponent(combined)));
  }

  public async exportDump(): Promise<Record<string, unknown>> {
    const dump: Record<string, unknown> = {};
    for (const store of STORES) {
      dump[store] = await this.getAll(store);
    }
    return dump;
  }

  public async importDump(data: Record<string, unknown[]>): Promise<void> {
    for (const store of STORES) {
      if (Array.isArray(data[store])) {
        for (const item of data[store] as Array<{ id: string }>) {
          await this.put(store, item);
        }
      }
    }
  }

  private async seedInitialData(): Promise<void> {
    const salt = 'ge_salt_2026';
    const pwHash = await this.hashPassword('1234', salt);
    const now = Date.now();
    const day = 86_400_000;

    // 1. Users
    const teacher: User = {
      id: 'u_teacher_1',
      name: 'Prof. Helena Mendes',
      email: 'prof@escola.com',
      role: 'teacher',
      avatar: '👩‍🏫',
      salt,
      pw: pwHash,
      created: now - 30 * day,
    };

    const studentMe: User = {
      id: 'u_student_1',
      name: 'Lucas Silva',
      email: 'aluno@escola.com',
      role: 'student',
      avatar: '🦊',
      title: 'Aventureiro do Saber',
      salt,
      pw: pwHash,
      created: now - 15 * day,
      streakShields: 1,
    };

    const studentsPeers: User[] = [
      { id: 'u_student_2', name: 'Beatriz Santos', email: 'bia@escola.com', role: 'student', avatar: '🦄', salt, pw: pwHash, created: now - 14 * day },
      { id: 'u_student_3', name: 'Gabriel Souza', email: 'gabriel@escola.com', role: 'student', avatar: '🤖', salt, pw: pwHash, created: now - 12 * day },
      { id: 'u_student_4', name: 'Mariana Costa', email: 'mari@escola.com', role: 'student', avatar: '🐼', salt, pw: pwHash, created: now - 10 * day },
      { id: 'u_student_5', name: 'Thiago Oliveira', email: 'thiago@escola.com', role: 'student', avatar: '🚀', salt, pw: pwHash, created: now - 8 * day },
      { id: 'u_student_6', name: 'Sofia Lima', email: 'sofia@escola.com', role: 'student', avatar: '🐙', salt, pw: pwHash, created: now - 7 * day },
    ];

    for (const u of [teacher, studentMe, ...studentsPeers]) {
      await this.put('users', u);
    }

    // 2. Class
    const classId = '7A2026';
    const classRoom: ClassRoom = {
      id: classId,
      name: '7º Ano A - Fundamental II',
      owner: teacher.id,
      created: now - 20 * day,
      subjects: [
        { id: 'sub_mat', name: 'Matemática', color: '#6366f1', icon: '📐' },
        { id: 'sub_cien', name: 'Ciências da Natureza', color: '#10b981', icon: '🔬' },
        { id: 'sub_port', name: 'Língua Portuguesa', color: '#f59e0b', icon: '📖' },
        { id: 'sub_geo', name: 'Geografia & História', color: '#ec4899', icon: '🌍' },
      ],
    };
    await this.put('classes', classRoom);

    // 3. Members
    const members: Member[] = [studentMe, ...studentsPeers].map(s => ({
      id: `${classId}_${s.id}`,
      classId,
      uid: s.id,
      name: s.name,
      avatar: s.avatar,
      joinedAt: now - 10 * day,
    }));
    for (const m of members) {
      await this.put('members', m);
    }

    // 4. Activities
    const activities: Activity[] = [
      {
        id: 'act_mat_quiz',
        classId,
        sub: 'sub_mat',
        kind: 'quiz',
        title: 'Frações, Porcentagens e Razões',
        xp: 15,
        time: 25,
        due: '',
        questions: [
          {
            q: 'Quanto é 1/2 + 1/4 somado?',
            o: ['3/4', '2/6', '1/6', '2/4'],
            a: 0,
            e: 'Reduzindo ao mesmo denominador: 2/4 + 1/4 = 3/4.',
          },
          {
            q: 'Qual fração representa 75% de um valor?',
            o: ['1/2', '3/4', '2/3', '4/5'],
            a: 1,
            e: '75/100 simplificado por 25 resulta em 3/4.',
          },
          {
            q: 'Se uma pizza tem 8 fatias e você comeu 3, que fração sobrou?',
            o: ['3/8', '5/8', '1/2', '4/8'],
            a: 1,
            e: 'A pizza inteira é 8/8. Subtraindo 3/8, sobram 5/8.',
          },
        ],
      },
      {
        id: 'act_boss_mat',
        classId,
        sub: 'sub_mat',
        kind: 'boss',
        title: 'Batalha do Chefe: O Titã das Frações',
        xp: 25,
        time: 20,
        due: '',
        questions: [
          {
            q: 'O Titã ataca! Qual fração é estritamente maior que 1/2?',
            o: ['2/5', '3/5', '1/3', '4/9'],
            a: 1,
            e: '3/5 = 0,60, que é maior que 1/2 = 0,50!',
          },
          {
            q: 'Golpe crítico: simplifique a fração 18/24 dividindo por 6.',
            o: ['3/4', '2/3', '4/5', '1/2'],
            a: 0,
            e: '18÷6 = 3 e 24÷6 = 4. Fração irredutível: 3/4!',
          },
          {
            q: 'Escudo arcano: quanto é 2/3 de 15?',
            o: ['8', '10', '12', '5'],
            a: 1,
            e: '15 dividido por 3 é 5. Multiplicado por 2 = 10!',
          },
        ],
      },
      {
        id: 'act_cien_vf',
        classId,
        sub: 'sub_cien',
        kind: 'vf',
        title: 'Desafio Relâmpago V/F: O Corpo Humano',
        xp: 10,
        time: 15,
        due: '',
        questions: [
          {
            q: 'As hemácias são responsáveis pelo transporte de oxigênio no sangue.',
            o: ['Verdadeiro', 'Falso'],
            a: 0,
            e: 'Verdadeiro! A hemoglobina nas hemácias se liga ao oxigênio.',
          },
          {
            q: 'O coração humano possui apenas duas cavidades (átrio e ventrículo).',
            o: ['Verdadeiro', 'Falso'],
            a: 1,
            e: 'Falso! O coração possui 4 cavidades: 2 átrios e 2 ventrículos.',
          },
          {
            q: 'A fotossíntese produz gás carbônico e consome oxigênio no pico de luz.',
            o: ['Verdadeiro', 'Falso'],
            a: 1,
            e: 'Falso! A fotossíntese consome CO2 e libera O2.',
          },
        ],
      },
      {
        id: 'act_port_pairs',
        classId,
        sub: 'sub_port',
        kind: 'pairs',
        title: 'Ligue os Pares: Figuras de Linguagem',
        xp: 20,
        time: 30,
        due: '',
        questions: [],
        pairs: [
          ['Metáfora', 'Comparação implícita sem conjunção'],
          ['Hipérbole', 'Exagero intencional e expressivo'],
          ['Personificação', 'Atribuição de traços humanos a seres inanimados'],
          ['Eufemismo', 'Suavização de uma expressão desagradável'],
        ],
      },
      {
        id: 'act_geo_type',
        classId,
        sub: 'sub_geo',
        kind: 'type',
        title: 'Desafio Digitado: Capitais do Brasil',
        xp: 15,
        time: 30,
        due: '',
        questions: [
          {
            q: 'Qual é a capital federal do Brasil?',
            ans: ['Brasília', 'Brasilia'],
            e: 'Brasília foi inaugurada em 1960 pelo presidente Juscelino Kubitschek.',
          },
          {
            q: 'Qual é a capital do estado da Bahia?',
            ans: ['Salvador', 'Salvador da Bahia'],
            e: 'Salvador foi a primeira capital do Brasil colonial.',
          },
        ],
      },
    ];

    for (const a of activities) {
      await this.put('activities', a);
    }

    // 5. Initial results for leaderboard
    const sampleResults: Result[] = [
      {
        id: 'res_1',
        actId: 'act_mat_quiz',
        classId,
        uid: studentMe.id,
        name: studentMe.name,
        av: studentMe.avatar,
        kind: 'quiz',
        correct: 3,
        total: 3,
        xp: 65,
        best: 3,
        per: [true, true, true],
        at: now - 1 * day,
      },
      {
        id: 'res_2',
        actId: 'act_cien_vf',
        classId,
        uid: 'u_student_2',
        name: 'Beatriz Santos',
        av: '🦄',
        kind: 'vf',
        correct: 3,
        total: 3,
        xp: 50,
        best: 3,
        per: [true, true, true],
        at: now - 2 * day,
      },
      {
        id: 'res_3',
        actId: 'act_mat_quiz',
        classId,
        uid: 'u_student_3',
        name: 'Gabriel Souza',
        av: '🤖',
        kind: 'quiz',
        correct: 2,
        total: 3,
        xp: 35,
        best: 2,
        per: [true, true, false],
        at: now - 3 * day,
      },
      {
        id: 'res_4',
        actId: 'act_port_pairs',
        classId,
        uid: 'u_student_4',
        name: 'Mariana Costa',
        av: '🐼',
        kind: 'pairs',
        correct: 4,
        total: 4,
        xp: 80,
        best: 4,
        per: [true, true, true, true],
        at: now - 2 * day,
      },
      {
        id: 'res_5',
        actId: 'act_boss_mat',
        classId,
        uid: 'u_student_5',
        name: 'Thiago Oliveira',
        av: '🚀',
        kind: 'boss',
        win: true,
        correct: 3,
        total: 3,
        xp: 95,
        best: 3,
        per: [true, true, true],
        at: now - 1 * day,
      },
    ];

    for (const r of sampleResults) {
      await this.put('results', r);
    }
  }
}

export const db = new DatabaseService();
