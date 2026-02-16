# PRD: BlockFlow - Local-First Hierarchical Task Manager
- **Version:** 1.0.0 (MVP)
- **Status:** Approved for Development
- **Author:** PRD Jam
- **Date:** 2024-05-21

## 1. Project Overview
### 1.1 Problem Statement
기존 투두 리스트는 구조가 평면적(Flat)이라 복잡한 사고 확장이 어렵고, 노션(Notion) 같은 툴은 무겁고 로그인 과정이 번거롭다. 사용자들은 **"로그인 없이, 즉시 실행되며, 노션처럼 자유롭게 블록을 중첩하고 이동할 수 있는"** 가벼운 도구를 원한다.

### 1.2 Goal & Objectives
* **Zero-Friction:** 로그인, 로딩, 서버 대기 시간 0초.
* **Intuitive Hierarchy:** `Tab`, `Shift+Tab` 및 Drag & Drop을 통한 무제한 Depth 지원.
* **Local Persistence:** 브라우저 `LocalStorage`를 활용한 데이터 영구 보존.

### 1.3 Target Audience
* **Persona:** "The Structured Thinker"
    * 단순 나열보다 분류와 위계(Hierarchy)를 통해 업무를 쪼개는 습관이 있는 기획자, 개발자.
    * 마우스보다 키보드 단축키 활용을 선호하는 파워 유저.

---

## 2. User Stories & Acceptance Criteria

| ID | User Story | Acceptance Criteria (AC) |
|:---|:---|:---|
| **US-1** | 사용자는 텍스트를 입력하고 Enter를 눌러 새 항목을 추가할 수 있다. | - Enter 키 입력 시 현재 블록 아래에 형제(Sibling) 블록 생성.<br>- 커서가 즉시 새 블록으로 이동(Focus). |
| **US-2** | 사용자는 Tab 키를 눌러 항목을 하위 레벨로 이동시킬 수 있다. | - Tab 입력 시 현재 블록이 **'직전 상위 블록'의 자식(Child)**으로 이동.<br>- UI상 들여쓰기(Indentation) 적용 (예: 24px padding-left). |
| **US-3** | 사용자는 Shift+Tab을 눌러 항목을 상위 레벨로 올릴 수 있다. | - 현재 부모 블록에서 벗어나 부모의 형제(Sibling) 레벨로 이동. |
| **US-4** | 사용자는 드래그 앤 드롭으로 블록의 순서와 위계를 변경할 수 있다. | - 블록 좌측 핸들(`::`)을 잡고 이동.<br>- 다른 블록 사이(위/아래) 또는 내부(Inside)로 드롭 가능 시 가이드라인 표시. |
| **US-5** | 사용자는 브라우저를 닫았다 열어도 데이터가 유지되어야 한다. | - 모든 상태 변경 시 `localStorage` 즉시 동기화.<br>- 재접속 시 마지막 상태 그대로 렌더링. |
| **US-6** | 사용자는 완료된 항목을 시각적으로 구분할 수 있다. | - 체크박스 클릭 시 텍스트에 `line-through` 스타일 적용 및 텍스트 색상 흐리게 처리 (`gray-400`). |

---

## 3. Functional Requirements (Technical Specs)

### 3.1 Data Structure (JSON Schema)
노션과 유사한 트리 구조를 지향하되, DnD 라이브러리의 호환성을 위해 **Flat Data with Parent Reference** 방식을 권장합니다. (트리 순회 비용 최소화)

```typescript
type Block = {
  id: string;          // UUID
  content: string;     // 할 일 텍스트
  isCompleted: boolean;
  parentId: string | null; // 최상위 루트일 경우 null
  order: number;       // 형제 노드 간의 순서 정렬용 (float 권장)
  isCollapsed?: boolean; // 하위 항목 접기/펼치기 상태 (Optional)
};

// State Interface
interface TaskState {
  blocks: Record<string, Block>; // ID를 키로 하는 Map 구조 (O(1) 접근)
  rootOrder: string[]; // 최상위 블록 ID 배열
}
```

### 3.2 Core Logic & Algorithms
**Indentation Logic (Tab Key):**

1. 현재 블록(Target)의 Previous Sibling을 찾음.
2. Target.parentId를 Previous Sibling.id로 변경.
3. Previous Sibling이 없을 경우 동작하지 않음.

**Outdentation Logic (Shift+Tab Key):**

1. 현재 블록(Target)의 Parent를 찾음.
2. Target.parentId를 Parent.parentId로 변경.
3. Target을 Parent의 다음 형제(Next Sibling) 위치로 이동.

**Local Storage Sync:**

상태 변경(Update, Delete, Add) 발생 시 `debounce(500ms)`를 적용하여 `localStorage.setItem('blockflow_v1', JSON.stringify(state))` 실행.

### 3.3 Interactions
- **Focus Management:** 엔터 키로 새 블록 생성 시, `requestAnimationFrame`을 사용하여 새로 생성된 DOM 요소의 input에 즉시 `focus()`를 줘야 함.
- **Hover Action:** 블록 좌측의 'Drag Handle'(⋮⋮)과 'Delete Button'(×)은 마우스 오버(Hover) 시에만 노출하여 UI 잡음을 최소화.

---

## 4. UI/UX Guidelines

### 4.1 Layout
- **Canvas:** 화면 중앙에 최대 너비 800px의 컨테이너 배치 (가독성 최적화).
- **Whitespace:** 충분한 줄 간격 (`leading-relaxed`, `py-2`) 확보.

### 4.2 Typography & Components
- **Font:** System Sans-serif (Inter, San Francisco, Pretendard).
- **Input:** `input` 태그 대신 `contenteditable` 속성을 가진 `div` 또는 자동 높이 조절되는 `textarea` 사용 (여러 줄 입력 대응).
- **Icons:** Lucide-react 사용 (Handle: `GripVertical`, Check: `Square`/`CheckSquare`).

---

## 5. Tech Stack Recommendation

| Category | Choice | Rationale |
|:---|:---|:---|
| **Core Framework** | Vite + React (TypeScript) | Next.js는 불필요하게 무거움(SSG/SSR 불필요). 순수 CSR로 가장 가볍게 빌드. |
| **State Management** | Zustand | Redux보다 가볍고 보일러플레이트가 적음. 트리 구조 상태 업데이트에 유리. |
| **Drag & Drop** | dnd-kit (또는 @hello-pangea/dnd) | 모던한 React Hook 기반, 접근성(Accessibility) 우수, 가상화 리스트 지원 용이. |
| **Styling** | Tailwind CSS | 클래스명 고민 없이 빠른 프로토타이핑 및 일관된 디자인 시스템 적용. |
| **Persistence** | usehooks-ts (useLocalStorage) | 로컬 스토리지 연동을 훅 하나로 간단하게 처리. |

---

## 6. User Experience Walkthrough

### 입력의 흐름 (Typing Flow)
사용자님이 "프로젝트 기획서 작성"이라고 치고 `Enter`를 칩니다. 딜레이 없이 바로 아래 줄에 새로운 입력칸이 생깁니다.
여기에 "시장 조사"라고 적고, 이게 기획서 작성의 하위 업무라는 생각이 듭니다. 마우스로 갈 필요 없이 바로 `Tab` 키를 딱 누릅니다.
순간적으로 "시장 조사" 블록이 오른쪽으로 24픽셀 쓱 밀려들어가면서(Indentation), 상위 항목인 "프로젝트 기획서 작성"에 종속됩니다.

### 정리의 미학 (Organizing Flow)
할 일을 쭉 적다 보니 순서가 마음에 안 듭니다. 블록 왼쪽에 마우스를 가져가니 숨겨져 있던 `⋮⋮` 핸들이 나타납니다.
그걸 잡고 드래그합니다. 드래그하는 동안 파란색 가이드 선이 "이 블록이 어디에 떨어질지"를 명확히 보여줍니다. 원하는 위치에 놓으면(Drop), 데이터 구조 내부적으로 `order` 값과 `parentId`가 즉시 재계산되고 화면은 부드럽게 재배치됩니다.

### 데이터 보존 (Persistence)
작업 도중 실수로 브라우저 탭을 닫았습니다. 다시 엽니다.
로딩 바 같은 건 없습니다. 방금 작성하던 들여쓰기 구조 그대로 화면에 뜹니다. 서버에 갔다 오는 게 아니라, 사용자님의 브라우저 로컬 스토리지에 저장되어 있었기 때문입니다.
