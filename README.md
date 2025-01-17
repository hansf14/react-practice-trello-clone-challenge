# React Practice Trello Clone Challenge

- **One of my personal digital nomad life projects (for practice).**
- **Project current status: [complete]**:ballot_box_with_check:
- **Tech**
<p>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white&logoWidth=25" height="25px"/>
  </div>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white&logoWidth=25" height="25px"/>
    <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white&logoWidth=25" height="25px"/>
    <img src="https://img.shields.io/badge/Recoil-3578E5?style=flat&logo=recoil&logoColor=white&logoWidth=25" height="25px"/>
  </div>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/Styled Components-DB7093?style=flat&logo=styledcomponents&logoColor=white&logoWidth=25" height="25px"/>
  </div>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/React Hook Form-EC5990?style=flat&logo=reacthookform&logoColor=white&logoWidth=25" height="25px"/>
  </div>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/Ant Design-0170FE?style=flat&logo=antdesign&logoColor=white&logoWidth=25" height="25px"/>
  </div>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/@hello%E2%80%93pangea%2Fdnd-black?style=flat&logo=@hello%E2%80%93pangea%2Fdnd&logoColor=white&logoWidth=25" height="25px"/>
  </div>
  <div>
    &emsp;
    <img src="https://img.shields.io/badge/class%E2%80%93transformer-black?style=flat&logo=class%E2%80%93transformer&logoColor=white&logoWidth=25" height="25px"/>
  </div>
</p>

- **Features**
  - **Category CRUD**
  - **Task CRUD**
  - **Supports multi-line category**
  - **Supports multi-line task**
  - **Category(board) position manipulation via DnD**
  - **Task(card) position manipulation via DnD**
  - **Persistency (refresh, reopen)**
    - **Auto-save whenever change is made**
    - **Able to manually reset/remove the saved data**
    - **Able to manually save the current data**
  - **Self-implemented DnD drop position preview**
    - **cf> useDragScroll.tsx**
    - **Whenever a category(board)/task(card) is dragged, a drop position preview is displayed.**
  - **Self-implemented DnD auto-scroll**
    - **cf> useDragPositionPreview.ts**
    - **Whenever the pointer/cursor is near the edge of the container/window while dragging, the auto-scroll is triggered and scrolls the container/window.**
    - **I decided to implement it by myself because...**
      - **1. The @hello-pangea/dnd & react-beautiful-dnd libraries don't support auto scroll buffer zone and scroll speed for multiple scroll containers.**
      - **2. The @hello-pangea/dnd & react-beautiful-dnd libraries don't support auto-scroll for nested scroll containers.** 
  - **Mobile support**
    - **Responsive design**
    - **DnD, drag position preview and auto-scroll are all also available at mobile.**
  - **Other many little functionalities for better UX**
- **Edit: Known bugs (2025.01.18 ~)**
  - **Card in board drag scroll (at mobile devices) not working good.**
- **Demo: [React Practice Trello Clone Challenge](https://hansf14.github.io/react-practice-trello-clone-challenge)**
- **Preview Screenshots**
<p>
  <div>
    &emsp;
    <img width="500" src="preview-screenshots/01.png" alt="01.png" />
  </div>
</p>

<br/>
