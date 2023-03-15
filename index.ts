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
  setDoc,
} from '@firebase/firestore';
import { Question, PermanentData } from './type';

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

const peingApiClient = axios.create({
  withCredentials: true,
  headers: {
    cookie: `${process.env.APP_COOKIE || ''}`,
  },
});

if (!Object.values(environments).every((v) => !!v)) {
  console.error('Missing Environment');
  process.exit(1);
}

async function getDataDocumentRef(): Promise<
  DocumentReference<PermanentData>
> {
  const dataRef = doc<PermanentData>(
    collection(
      firestore,
      environments.APP_FIREBASE_COLLECTION_ID,
    ) as CollectionReference<PermanentData>,
    environments.APP_FIREBASE_DOCUMENT_ID,
  );
  return dataRef;
}

async function getLastUpdatedAt(): Promise<string | undefined> {
  const documentRef = await getDataDocumentRef();
  const peingNotifierData = (
    await getDoc<PermanentData>(documentRef)
  ).data();
  return peingNotifierData?.lastUpdatedAt;
}

async function run() {
  const response = await peingApiClient.get('https://peing.net/ja/box');
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

  await setDoc(dataRef, {
    lastUpdatedAt: dayjs().format(),
  });

  await axios.post(
    `https://maker.ifttt.com/trigger/${process.env.APP_IFTTT_EVENT_NAME}/json/with/key/${process.env.APP_IFTTT_SERVICE_KEY}`,
    {
      value1: question.body,
      value2: question.eye_catch.url,
    },
  );
}

run();
