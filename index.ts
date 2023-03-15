import axios from 'axios';
import { JSDOM } from 'jsdom';
import dayjs from 'dayjs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';
import {
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  setDoc,
} from '@firebase/firestore';

const environments: { [key: string]: string } = {
  APP_FIREBASE_COLLECTION_ID: `${process.env.APP_FIREBASE_COLLECTION_ID}`,
  APP_FIREBASE_DOCUMENT_ID: `${process.env.APP_FIREBASE_DOCUMENT_ID}`,
  APP_FIREBASE_API_KEY: `${process.env.APP_FIREBASE_API_KEY}`,
  APP_FIREBASE_PROJECT_ID: `${process.env.APP_FIREBASE_PROJECT_ID}`,
};

const app = initializeApp({
  apiKey: environments.APP_FIREBASE_API_KEY,
  projectId: environments.APP_FIREBASE_PROJECT_ID,
});

const firestore = getFirestore(app);

type Question = {
  id: number;
  get_user_id: number;
  body: string;
  enum_status: string;
  uuid_hash: string;
  eye_catch: {
    url: string;
  };
  locale: string;
  country: null;
  hope_answer_type: string;
  make_item_url: string;
  created_at: Date;
  updated_at: Date;
  time: string;
  newer: boolean;
  hope_video: boolean;
  hope_audio: boolean;
  item_url: string;
  answer_url: string;
  unread: boolean;
  read: boolean;
  dust: boolean;
  eye_catch_url: string;
  answer_body: null;
  active_broadcast_banner: null;
  is_popular_community_item: boolean;
  is_liked: boolean;
  is_receive_dm: boolean;
  is_choose_question: boolean;
};

const iftttApiClient = axios.create({
  baseURL: 'https://maker.ifttt.com',
});

const apiClient = axios.create({
  withCredentials: true,
  headers: {
    cookie: `${process.env.APP_COOKIE || ''}`,
  },
});

async function getDataDocumentRef(): Promise<
  DocumentReference<{ lastUpdatedAt: string }>
> {
  const dataRef = doc<{ lastUpdatedAt: string }>(
    collection(
      firestore,
      environments.APP_FIREBASE_COLLECTION_ID,
    ) as CollectionReference<{ lastUpdatedAt: string }>,
    environments.APP_FIREBASE_DOCUMENT_ID,
  );
  return dataRef;
}

async function getLastUpdatedAt(): Promise<string | undefined> {
  const documentRef = await getDataDocumentRef();
  const peingNotifierData = (
    await getDoc<{ lastUpdatedAt: string }>(documentRef)
  ).data();
  return peingNotifierData?.lastUpdatedAt;
}

async function run() {
  const response = await apiClient.get('https://peing.net/ja/box');
  const DOM = new JSDOM(response.data);
  const questionElement = DOM.window.document.body
    .querySelector('[data-questions]')
    ?.getAttribute('data-questions');
  if (!questionElement) {
    console.error('Missing question list element.');
    return;
  }
  const questions: Question[] = JSON.parse(decodeURIComponent(questionElement));
  const [question] = questions;
  const lastUpdatedAt = await getLastUpdatedAt();
  const dataRef = await getDataDocumentRef();

  if (dayjs(question.created_at).diff(lastUpdatedAt) < 0) {
    console.log('Missing questions');
    return;
  }

  setDoc(dataRef, {
    lastUpdatedAt: dayjs().format(),
  });

  await iftttApiClient.post(
    `/trigger/${process.env.APP_IFTTT_EVENT_NAME}/json/with/key/${process.env.APP_IFTTT_SERVICE_KEY}`,
    {
      value1: question.body,
      value2: question.eye_catch.url,
    },
  );
}

run();
