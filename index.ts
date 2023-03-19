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
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

const environments: { [key: string]: string } = {
  APP_FIREBASE_COLLECTION_ID: `${process.env.APP_FIREBASE_COLLECTION_ID}`,
  APP_FIREBASE_DOCUMENT_ID: `${process.env.APP_FIREBASE_DOCUMENT_ID}`,
  APP_FIREBASE_API_KEY: `${process.env.APP_FIREBASE_API_KEY}`,
  APP_FIREBASE_PROJECT_ID: `${process.env.APP_FIREBASE_PROJECT_ID}`,
  APP_COOKIE: `${process.env.APP_COOKIE}`,
  APP_IFTTT_EVENT_NAME: `${process.env.APP_IFTTT_EVENT_NAME}`,
  APP_IFTTT_SERVICE_KEY: `${process.env.APP_IFTTT_SERVICE_KEY}`,
};

const app = initializeApp({
  apiKey: environments.APP_FIREBASE_API_KEY,
  projectId: environments.APP_FIREBASE_PROJECT_ID,
});

const firestore = getFirestore(app);

const peingApiClient = axios.create({
  withCredentials: true,
  headers: {
    cookie: `${environments.APP_COOKIE || ''}`,
  },
});

if (!Object.values(environments).every((v) => !!v)) {
  console.error('Missing Environment');
  process.exit(1);
}

function getDataDocumentRef(): DocumentReference<PermanentData> {
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
  const documentRef = getDataDocumentRef();
  const peingNotifierData = (await getDoc<PermanentData>(documentRef)).data();
  return peingNotifierData?.lastUpdatedAt;
}

async function run() {
  try {
    const response = await peingApiClient.get('https://peing.net/ja/box');
    const DOM = new JSDOM(response.data);
    const questionElement = DOM.window.document.body
      .querySelector('[data-questions]')
      ?.getAttribute('data-questions');
    if (!questionElement) {
      console.error('Missing question list element.');
      return;
    }
    const questions: Question[] = JSON.parse(
      decodeURIComponent(questionElement),
    );
    const [question] = questions;
    const lastUpdatedAt = await getLastUpdatedAt();
    const dataRef = getDataDocumentRef();

    if (dayjs(question.created_at).diff(lastUpdatedAt) < 0) {
      console.log('Missing questions');
      return;
    }

    await setDoc(dataRef, {
      lastUpdatedAt: dayjs().format(),
    });

    await axios
      .post(
        `https://maker.ifttt.com/trigger/${environments.APP_IFTTT_EVENT_NAME}/with/key/${environments.APP_IFTTT_SERVICE_KEY}`,
        {
          value1: dayjs().format('YYYY/MM/DD HH:mm'),
          value2: question.body,
          value3: question.eye_catch.url,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((r) => {
        console.log(r);
      })
      .catch((e) => {
        console.log(e.response.data.errors);
      });
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

run();
