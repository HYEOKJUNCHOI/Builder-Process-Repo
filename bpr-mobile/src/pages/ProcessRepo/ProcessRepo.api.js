import {
  collection, query, orderBy, getDocs, doc, setDoc,
  getDoc, deleteDoc, updateDoc, where,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../utils/firebaseConfig';
import useAuthStore from '../../store/authStore';

/** 템플릿 목록 조회 (최신순) */
export async function fetchTemplates() {
  const snap = await getDocs(collection(db, 'templates'));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // createdAt 오름차순 — 오래된 템플릿이 앞에
  return list.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

/** 현장 생성 (템플릿 공정 복사 포함) */
export async function createProject(payload) {
  const userId = useAuthStore.getState().userId;
  const newRef = doc(collection(db, 'projects'));

  await setDoc(newRef, {
    name: payload.name,
    address: payload.address || null,
    lat: payload.lat ?? null,       // 현장 위도 — 날씨/거리 계산용 (주소 미등록 현장 대응)
    lng: payload.lng ?? null,       // 현장 경도
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    templateId: payload.templateId || null,
    ownerId: userId,
    createdAt: new Date().toISOString(),
  });

  if (payload.templateId) {
    const templateSnap = await getDoc(doc(db, 'templates', payload.templateId));
    if (templateSnap.exists()) {
      const majorsSnap = await getDocs(
        collection(db, `templates/${payload.templateId}/template_major_processes`),
      );
      for (const tMajor of majorsSnap.docs) {
        const newMajorRef = doc(collection(db, `projects/${newRef.id}/major_processes`));
        await setDoc(newMajorRef, {
          name: tMajor.data().name,
          displayOrder: tMajor.data().displayOrder,
          createdAt: new Date().toISOString(),
        });

        const minorsSnap = await getDocs(
          collection(db, `templates/${payload.templateId}/template_major_processes/${tMajor.id}/template_minor_processes`),
        );
        const sorted = [...minorsSnap.docs].sort((a, b) =>
          (a.data().createdAt ?? '').localeCompare(b.data().createdAt ?? ''),
        );
        for (const tMinor of sorted) {
          await setDoc(doc(collection(db, `projects/${newRef.id}/minor_processes`)), {
            majorId: newMajorRef.id,
            name: tMinor.data().name,
            status: 'WAITING',
            isToday: false,
            memo: tMinor.data().memo ?? '',
            displayOrder: tMinor.data().displayOrder,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return { id: newRef.id };
}

/**
 * 템플릿 썸네일 업로드
 * @param {string} templateId
 * @param {{ uri: string, mimeType: string }} imageAsset - expo-image-picker result
 * @returns {string} downloadURL
 */
export async function uploadTemplateThumbnail(templateId, imageAsset) {
  // React Native에서 fetch로 blob 변환
  const response = await fetch(imageAsset.uri);
  const blob = await response.blob();

  const filePath = `templates/${templateId}/thumbnail.jpg`;
  const ref = storageRef(storage, filePath);
  await uploadBytes(ref, blob, { contentType: imageAsset.mimeType ?? 'image/jpeg' });

  const url = await getDownloadURL(ref);
  // Firestore 템플릿 문서에 thumbnailUrl 업데이트
  await updateDoc(doc(db, 'templates', templateId), { thumbnailUrl: url });
  return url;
}

/** 템플릿 삭제 */
export async function deleteTemplate(templateId) {
  await deleteDoc(doc(db, 'templates', templateId));
}
