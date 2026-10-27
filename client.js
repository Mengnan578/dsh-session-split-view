window.__ModuleLoader__.load({
  id: 'dsh-session-split-view',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;

    const NS = 'splitView';
    const MAX_COMPANIONS = 3;
    const MAX_SESSIONS = MAX_COMPANIONS + 1;
    const STORAGE_KEY = 'dsh.split-view.v2';
    const LEGACY_STORAGE_KEY = 'dsh.split-view.v1';
    const SOURCE = 'splitView';

    // ---------------------------------------------------------------------
    // Copy
    // ---------------------------------------------------------------------

    const zh = {
      'meta.title': '会话分屏',
      'meta.description': '把其他会话并排加入当前会话，最多同时显示四个会话。',
      'panel.title': '会话分屏',
      'panel.count': '{count} 个会话',
      'panel.add': '添加会话',
      'panel.exit': '退出分屏',
      'panel.limit': '最多同时显示 {count} 个会话',
      'picker.title': '选择要分屏的会话',
      'picker.subtitle': '选择一个会话，和当前会话并排显示。',
      'picker.search': '搜索会话',
      'picker.empty': '没有匹配的会话',
      'picker.opened': '已加入',
      'picker.limit': '已达 {count} 个会话上限，先关闭一个分屏',
      'picker.newSession': '新会话',
      'picker.untitled': '未命名会话',
      'pane.current': '当前会话',
      'pane.openSingle': '在单会话中打开',
      'pane.close': '关闭此分屏',
      'pane.running': '运行中',
      'pane.loading': '正在打开会话…',
      'pane.failed': '会话打开失败',
      'pane.retry': '重试',
      'pane.newSession': '新会话',
      'pane.untitled': '未命名会话',
      'pane.unknownWorkspace': '未知工作区',
      'action.split': '分屏查看',
      'action.openInSplit': '在分屏中打开',
      'error.render': '这个分屏暂时无法显示。',
      'error.retry': '重新加载分屏',
      'divider.resize': '调整分屏宽度',
    };

    const en = {
      'meta.title': 'Session Split View',
      'meta.description': 'Add other sessions beside the current one, up to four sessions at once.',
      'panel.title': 'Session split view',
      'panel.count': '{count} sessions',
      'panel.add': 'Add session',
      'panel.exit': 'Exit split view',
      'panel.limit': 'At most {count} sessions can be shown at once',
      'picker.title': 'Choose a session to split with',
      'picker.subtitle': 'Pick a session to show beside the current one.',
      'picker.search': 'Search sessions',
      'picker.empty': 'No matching sessions',
      'picker.opened': 'Added',
      'picker.limit': 'Limit of {count} reached — close one pane first',
      'picker.newSession': 'New session',
      'picker.untitled': 'Untitled session',
      'pane.current': 'Current',
      'pane.openSingle': 'Open in single view',
      'pane.close': 'Close this pane',
      'pane.running': 'Running',
      'pane.loading': 'Opening session…',
      'pane.failed': 'Could not open this session',
      'pane.retry': 'Retry',
      'pane.newSession': 'New session',
      'pane.untitled': 'Untitled session',
      'pane.unknownWorkspace': 'Unknown workspace',
      'action.split': 'Split view',
      'action.openInSplit': 'Open in split view',
      'error.render': 'This pane could not be displayed.',
      'error.retry': 'Reload this pane',
      'divider.resize': 'Resize panes',
    };

    // ---------------------------------------------------------------------
    // Icons (16px grid, currentColor)
    // ---------------------------------------------------------------------

    function Svg({ size = 16, children, ...rest }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          ...rest,
        },
        children,
      );
    }

    function IconSplit(props) {
      return h(Svg, props, h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 3 }), h('path', { d: 'M12 4.5v15' }));
    }

    function IconPlus(props) {
      return h(Svg, props, h('path', { d: 'M12 5v14M5 12h14' }));
    }

    function IconClose(props) {
      return h(Svg, props, h('path', { d: 'M6 6l12 12M18 6L6 18' }));
    }

    function IconExpand(props) {
      return h(
        Svg,
        props,
        h('path', { d: 'M9 4H4v5M15 20h5v-5M4 4l6 6M20 20l-6-6' }),
      );
    }

    function IconSearch(props) {
      return h(Svg, props, h('circle', { cx: 11, cy: 11, r: 6.5 }), h('path', { d: 'M16 16l4 4' }));
    }

    function IconCheck(props) {
      return h(Svg, props, h('path', { d: 'M5 12.5l4.5 4.5L19 7.5' }));
    }

    // ---------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------

    function basename(path) {
      if (typeof path !== 'string' || path.length === 0) return '';
      const parts = path.split(/[\\/]+/).filter(Boolean);
      return parts.length === 0 ? path : parts[parts.length - 1];
    }

    function shortId(id) {
      const text = String(id ?? '').replace(/^session-/, '');
      return text.length > 10 ? text.slice(0, 8) : text;
    }

    function errorText(error) {
      let text = '';
      if (error !== null && typeof error === 'object' && typeof error.message === 'string') {
        text = error.message;
      } else {
        text = String(error ?? '');
      }
      return text.length > 300 ? `${text.slice(0, 300)}…` : text;
    }

    function titleOf(row, id, t) {
      const title = row !== undefined && typeof row.title === 'string' ? row.title.trim() : '';
      const display = row !== undefined && typeof row.displayTitle === 'string' ? row.displayTitle.trim() : '';
      if (title !== '') return title;
      if (display !== '') return display;
      if (row !== undefined && row.blank === true) return t('picker.newSession');
      return shortId(id);
    }

    function workspaceOf(workspaces, sessionId, row, t) {
      const items = workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.items) ? workspaces.items : [];
      for (const workspace of items) {
        if (Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(sessionId)) {
          const title = typeof workspace.title === 'string' ? workspace.title.trim() : '';
          return title !== '' ? title : basename(workspace.path) || t('pane.unknownWorkspace');
        }
      }
      const cwd = row !== undefined && typeof row.cwd === 'string' ? row.cwd : '';
      return basename(cwd);
    }

    function normalizeFractions(count, input) {
      if (count <= 0) return [];
      const equal = () => Array.from({ length: count }, () => 1 / count);
      if (!Array.isArray(input) || input.length !== count) return equal();
      const values = input.map((value) => Number(value));
      if (values.some((value) => !Number.isFinite(value) || value <= 0)) return equal();
      const min = count > 1 ? 0.15 : 1;
      const clamped = values.map((value) => Math.max(min, value));
      const sum = clamped.reduce((total, value) => total + value, 0);
      if (!(sum > 0)) return equal();
      return clamped.map((value) => value / sum);
    }

    function readStored() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null) {
          // The retired global panel stored its Session list in v1. Keep those
          // Sessions as companions rather than dropping the user's layout; the
          // current Session is filtered out when the split mode renders.
          let companions = [];
          try {
            const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacy !== null) {
              const parsedLegacy = JSON.parse(legacy);
              const sessions = parsedLegacy !== null && Array.isArray(parsedLegacy.sessions) ? parsedLegacy.sessions : [];
              companions = [
                ...new Set(
                  sessions
                    .filter((id) => typeof id === 'string' && id.length > 0)
                    .slice(0, MAX_COMPANIONS),
                ),
              ];
              window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ companions, fractions: [] }),
              );
              window.localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
          } catch (_legacyError) {
            // A malformed legacy value only loses the old layout.
          }
          return { companions, fractions: [] };
        }
        try {
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch (_legacyError) {
          // The old key is already gone or storage is read-only.
        }
        const parsed = JSON.parse(raw);
        const rawCompanions = parsed !== null && Array.isArray(parsed.companions) ? parsed.companions : [];
        const companions = [
          ...new Set(
            rawCompanions
              .filter((id) => typeof id === 'string' && id.length > 0)
              .slice(0, MAX_COMPANIONS),
          ),
        ];
        return {
          companions,
          fractions: parsed !== null && Array.isArray(parsed.fractions) ? parsed.fractions : [],
        };
      } catch (_error) {
        return { companions: [], fractions: [] };
      }
    }

    function writeStored(state) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ companions: state.companions, fractions: state.fractions }),
        );
      } catch (_error) {
        // A full or disabled storage must not break the open panel.
      }
    }

    // ---------------------------------------------------------------------
    // Store: split mode plus the companion Sessions shown beside the current
    // ---------------------------------------------------------------------

    function createStore(ctx) {
      const stored = readStored();
      let state = {
        companions: stored.companions,
        fractions: stored.fractions,
        mode: false,
        generation: 0,
      };
      const listeners = new Set();

      function publish(persist) {
        if (persist) writeStored(state);
        for (const listener of [...listeners]) listener();
      }

      return {
        getSnapshot: () => state,
        subscribe(listener) {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        hasCompanion: (id) => state.companions.includes(id),
        addCompanion(id) {
          if (typeof id !== 'string' || id.length === 0) return false;
          if (state.companions.includes(id)) return true;
          if (state.companions.length >= MAX_COMPANIONS) return false;
          state = {
            ...state,
            companions: [...state.companions, id],
            fractions: [],
          };
          publish(true);
          return true;
        },
        removeCompanion(id) {
          if (!state.companions.includes(id)) return;
          state = {
            ...state,
            companions: state.companions.filter((candidate) => candidate !== id),
            fractions: [],
          };
          publish(true);
        },
        replaceCompanion(oldId, newId) {
          const index = state.companions.indexOf(oldId);
          if (index < 0 || oldId === newId) return false;
          if (state.companions.includes(newId)) return false;
          const companions = state.companions.slice();
          companions[index] = newId;
          state = { ...state, companions, fractions: [] };
          publish(true);
          return true;
        },
        setMode(mode) {
          const next = mode === true;
          if (state.mode === next) return;
          state = { ...state, mode: next };
          publish(false);
        },
        setFractions(fractions) {
          state = { ...state, fractions: [...fractions] };
          publish(true);
        },
        bumpGeneration() {
          state = { ...state, generation: state.generation + 1 };
          publish(false);
        },
      };
    }

    // ---------------------------------------------------------------------
    // Retaining a session for one companion pane
    // ---------------------------------------------------------------------

    function useSessionReference(ctx, sessionId, generation) {
      const [state, setState] = React.useState({
        reference: null,
        error: null,
        generation,
        attempt: 0,
      });
      const [attempt, setAttempt] = React.useState(0);
      const retry = React.useCallback(() => {
        setAttempt((value) => value + 1);
      }, []);

      React.useEffect(() => {
        let cancelled = false;
        let reference;
        try {
          reference = ctx.sessions.retain(sessionId, { source: SOURCE });
        } catch (error) {
          setState({ reference: null, error, generation, attempt });
          return;
        }
        setState({ reference, error: null, generation, attempt });
        reference.ready.catch((error) => {
          if (!cancelled) setState({ reference: null, error, generation, attempt });
        });
        return () => {
          cancelled = true;
          try {
            reference.release();
          } catch (_error) {
            // Releasing an already orphaned reference is harmless.
          }
        };
      }, [ctx, sessionId, generation, attempt]);

      // A generation bump or a retry invalidates the previous reference before
      // the acquisition effect runs. Never hand a stale reference to
      // SessionProvider: during that one render it would resolve against the
      // wrong Controller generation and throw.
      const current = state.generation === generation && state.attempt === attempt;
      return {
        reference: current ? state.reference : null,
        error: current ? state.error : null,
        attempt,
        retry,
      };
    }

    // ---------------------------------------------------------------------
    // Error presentation
    // ---------------------------------------------------------------------

    function PaneFailure({ error, t, onRetry, onClose }) {
      return h(
        'div',
        { className: 'dsv-failure' },
        h('div', { className: 'dsv-failure-title' }, t('pane.failed')),
        h('div', { className: 'dsv-failure-body' }, errorText(error)),
        h(
          'div',
          { className: 'dsv-failure-actions' },
          onRetry !== null && onRetry !== undefined
            ? h('button', { type: 'button', className: 'dsv-btn', onClick: onRetry }, t('pane.retry'))
            : null,
          onClose !== null && onClose !== undefined
            ? h(
                'button',
                { type: 'button', className: 'dsv-btn dsv-btn--quiet', onClick: onClose },
                t('pane.close'),
              )
            : null,
        ),
      );
    }

    function RenderFailure({ error, t, onRetry, onClose }) {
      return h(
        'div',
        { className: 'dsv-failure' },
        h('div', { className: 'dsv-failure-title' }, t('error.render')),
        h('div', { className: 'dsv-failure-body' }, errorText(error)),
        h(
          'div',
          { className: 'dsv-failure-actions' },
          onRetry !== null && onRetry !== undefined
            ? h('button', { type: 'button', className: 'dsv-btn', onClick: onRetry }, t('error.retry'))
            : null,
          onClose !== null && onClose !== undefined
            ? h(
                'button',
                { type: 'button', className: 'dsv-btn dsv-btn--quiet', onClick: onClose },
                t('pane.close'),
              )
            : null,
        ),
      );
    }

    class PaneBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        console.error('[split-view] pane render failed:', error, info);
      }
      render() {
        if (this.state.error !== null) {
          return h(RenderFailure, {
            error: this.state.error,
            t: this.props.t,
            onRetry: this.props.onRetry,
            onClose: this.props.onClose,
          });
        }
        return this.props.children;
      }
    }

    // ---------------------------------------------------------------------
    // Session picker
    // ---------------------------------------------------------------------

    function buildPickerItems(sessions, workspaces, query, t) {
      if (sessions === undefined || sessions === null) return [];
      const archived =
        workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.archivedSessionIds)
          ? new Set(workspaces.archivedSessionIds)
          : new Set();
      const needle = query.trim().toLowerCase();
      const ids = Array.isArray(sessions.ids) ? sessions.ids : [];
      const items = [];
      for (const id of ids) {
        const row = sessions.byId?.[id];
        if (row === undefined || row === null) continue;
        if (row.origin === 'subagent') continue;
        if (row.archived === true || archived.has(id)) continue;
        const title = titleOf(row, id, t);
        const workspaceTitle = workspaceOf(workspaces, id, row, t);
        if (needle !== '') {
          const haystack = `${title} ${id} ${row.cwd ?? ''} ${workspaceTitle}`.toLowerCase();
          if (!haystack.includes(needle)) continue;
        }
        items.push({ id, row, title, workspaceTitle });
      }
      items.sort((left, right) => (right.row.updatedAt ?? 0) - (left.row.updatedAt ?? 0));
      return items.slice(0, 120);
    }

    function PickerRow({ item, t, open, running, onPick }) {
      const status = running
        ? h('span', { className: 'dsv-dot dsv-dot--running', 'aria-hidden': 'true' })
        : h('span', { className: 'dsv-dot', 'aria-hidden': 'true' });
      return h(
        'button',
        {
          type: 'button',
          className: open ? 'dsv-pick-row dsv-pick-row--open' : 'dsv-pick-row',
          onClick: () => onPick(item.id),
          title: open ? t('picker.opened') : item.title,
        },
        status,
        h(
          'span',
          { className: 'dsv-pick-main' },
          h('span', { className: 'dsv-pick-title' }, item.title),
          h(
            'span',
            { className: 'dsv-pick-meta' },
            item.workspaceTitle !== '' ? item.workspaceTitle : shortId(item.id),
            item.workspaceTitle !== '' ? h('span', { className: 'dsv-pick-sep' }, '·') : null,
            item.workspaceTitle !== '' ? shortId(item.id) : null,
          ),
        ),
        open ? h('span', { className: 'dsv-pick-state' }, h(IconCheck, { size: 13 }), t('picker.opened')) : null,
      );
    }

    function SessionPicker({ sessions, workspaces, t, openIds, onPick, autoFocus }) {
      const [query, setQuery] = React.useState('');
      const items = buildPickerItems(sessions, workspaces, query, t);
      const atLimit = openIds.size >= MAX_SESSIONS;
      return h(
        'div',
        { className: 'dsv-picker-body' },
        h(
          'label',
          { className: 'dsv-search' },
          h(IconSearch, { size: 14 }),
          h('input', {
            type: 'search',
            value: query,
            placeholder: t('picker.search'),
            'aria-label': t('picker.search'),
            autoFocus: autoFocus === true,
            onChange: (event) => setQuery(event.target.value),
          }),
        ),
        h(
          'div',
          { className: 'dsv-picker-list', role: 'list' },
          items.length === 0
            ? h('div', { className: 'dsv-picker-empty' }, t('picker.empty'))
            : items.map((item) =>
                h(
                  'div',
                  { role: 'listitem', key: item.id },
                  h(PickerRow, {
                    item,
                    t,
                    open: openIds.has(item.id),
                    running: item.row.running === true,
                    onPick,
                  }),
                ),
              ),
        ),
        atLimit
          ? h('div', { className: 'dsv-picker-foot' }, t('picker.limit', { count: MAX_SESSIONS }))
          : null,
      );
    }

    // ---------------------------------------------------------------------
    // A compact session picker anchored to a sidebar button. It portals out
    // of the sidebar column so the sidebar's own clipping cannot cut it.
    // ---------------------------------------------------------------------

    function AnchoredSessionPicker({
      open,
      anchorRef,
      onClose,
      sessions,
      workspaces,
      t,
      openIds,
      onPick,
      notice,
    }) {
      const popoverRef = React.useRef(null);
      const [position, setPosition] = React.useState(null);

      React.useLayoutEffect(() => {
        if (!open) {
          setPosition(null);
          return;
        }
        const button = anchorRef.current;
        if (button === null) return;
        const rect = button.getBoundingClientRect();
        const margin = 8;
        const width = Math.min(360, window.innerWidth - margin * 2);
        const maxHeight = Math.min(460, window.innerHeight - margin * 2);
        const belowSpace = window.innerHeight - rect.bottom - margin;
        const aboveSpace = rect.top - margin;
        const openBelow = belowSpace >= 260 || belowSpace >= aboveSpace;
        const height = Math.max(120, Math.min(maxHeight, openBelow ? belowSpace : aboveSpace));
        const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
        setPosition(
          openBelow
            ? { left, top: rect.bottom + margin, width, maxHeight: height }
            : { left, bottom: window.innerHeight - rect.top + margin, width, maxHeight: height },
        );
      }, [open, anchorRef]);

      React.useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          const inPopover = popoverRef.current !== null && popoverRef.current.contains(event.target);
          const inAnchor = anchorRef.current !== null && anchorRef.current.contains(event.target);
          if (!inPopover && !inAnchor) onClose();
        };
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        };
        const onResize = () => onClose();
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('resize', onResize);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown, true);
          window.removeEventListener('resize', onResize);
        };
      }, [open, anchorRef, onClose]);

      if (!open || position === null) return null;

      const popover = h(
        'div',
        {
          className: 'dsv-picker dsv-picker--anchored',
          ref: popoverRef,
          role: 'dialog',
          'aria-label': t('picker.title'),
          style: {
            position: 'fixed',
            left: position.left,
            top: position.top === undefined ? 'auto' : position.top,
            bottom: position.bottom === undefined ? 'auto' : position.bottom,
            right: 'auto',
            width: position.width,
            maxHeight: position.maxHeight,
            zIndex: 80,
          },
        },
        h(
          'div',
          { className: 'dsv-picker-head' },
          h('span', { className: 'dsv-picker-title' }, t('picker.title')),
          notice !== null && notice !== undefined
            ? h('span', { className: 'dsv-picker-notice' }, notice)
            : null,
        ),
        h(SessionPicker, {
          sessions,
          workspaces,
          t,
          openIds,
          onPick,
          autoFocus: true,
        }),
      );

      return typeof document === 'undefined' ? popover : ReactDOM.createPortal(popover, document.body);
    }

    // ---------------------------------------------------------------------
    // One pane: the shared embedded Conversation and its compact header
    // ---------------------------------------------------------------------

    function FixedChatConversationView(props) {
      return h(React.Fragment, null, props.renderSlot('conversation.session', { view: 'chat' }));
    }

    function createPaneComponent() {
      return function SplitPane(props) {
        const {
          sessionId,
          useSession,
          useConversation,
          useSessions,
          useWorkspaces,
          renderFactorySlot,
          paneIndex,
          paneCount,
          paneRef,
          isCurrent,
          canClose,
          onClosePane,
          onOpenSingle,
          onRetry,
          t,
        } = props;

        const session = useSession((value) => value);
        const conversation = useConversation((value) => value);
        const summary = useSessions((value) => value.byId[sessionId]);
        const workspaces = useWorkspaces((value) => value);

        const shellPhase =
          conversation.activeTargets.size > 0 ||
          (!session.blank && !session.awaitingFirstTurn) ||
          session.running
            ? 'active'
            : session.promptAttempted
              ? 'engaging'
              : 'blank';
        const summaryBlank = summary === undefined ? undefined : summary.blank;
        const parentAvailabilityPending =
          session.subagent?.address.mode === 'continuable' &&
          session.subagent.parentAvailable === undefined;
        const settling =
          (shellPhase === 'blank' && session.openState === 'loading' && summaryBlank !== true) ||
          parentAvailabilityPending;
        const hero = shellPhase === 'blank' && (session.openState === 'open' || summaryBlank === true);
        const phase = settling ? 'settling' : hero ? 'hero' : 'active';

        const title = titleOf(summary, sessionId, t);
        const workspaceTitle = workspaceOf(workspaces, sessionId, summary, t);
        const running = session.running === true;
        const closePane = canClose === true && onClosePane !== null && onClosePane !== undefined;

        const conversationBody = renderFactorySlot(
          'conversation.content',
          { variant: 'embedded', phase, hero },
          { slots: { views: FixedChatConversationView } },
        );

        return h(
          'div',
          {
            className: 'dsv-pane',
            ref: paneRef,
            'data-session': sessionId,
            'data-pane-index': paneIndex,
            'data-current': isCurrent === true ? 'true' : 'false',
            'aria-label': title,
          },
          h(
            'div',
            { className: 'dsv-pane-head' },
            running
              ? h('span', {
                  className: 'dsv-dot dsv-dot--running',
                  title: t('pane.running'),
                  'aria-label': t('pane.running'),
                })
              : h('span', { className: 'dsv-dot', 'aria-hidden': 'true' }),
            h(
              'span',
              { className: 'dsv-pane-heading' },
              h('span', { className: 'dsv-pane-title', title }, title),
              h(
                'span',
                { className: 'dsv-pane-meta' },
                isCurrent === true ? h('span', { className: 'dsv-current-badge' }, t('pane.current')) : null,
                workspaceTitle !== '' ? workspaceTitle : null,
                workspaceTitle !== '' ? h('span', { className: 'dsv-pick-sep' }, '·') : null,
                h('span', { className: 'dsv-pane-id' }, shortId(sessionId)),
                paneCount > 2 ? h('span', { className: 'dsv-pane-index' }, `${paneIndex + 1}/${paneCount}`) : null,
              ),
            ),
            h(
              'span',
              { className: 'dsv-pane-actions' },
              isCurrent !== true && onOpenSingle !== null && onOpenSingle !== undefined
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsv-iconbtn dsv-iconbtn--sm',
                      title: t('pane.openSingle'),
                      'aria-label': t('pane.openSingle'),
                      onClick: onOpenSingle,
                    },
                    h(IconExpand, { size: 14 }),
                  )
                : null,
              closePane
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsv-iconbtn dsv-iconbtn--sm',
                      title: t('pane.close'),
                      'aria-label': t('pane.close'),
                      onClick: onClosePane,
                    },
                    h(IconClose, { size: 14 }),
                  )
                : null,
            ),
          ),
          h(
            'div',
            { className: 'dsv-pane-body' },
            h(
              PaneBoundary,
              {
                t,
                onRetry: onRetry === undefined ? null : onRetry,
                onClose: closePane ? onClosePane : null,
              },
              conversationBody,
            ),
          ),
        );
      };
    }

    // ---------------------------------------------------------------------
    // One companion pane host: retains the session and binds it explicitly
    // ---------------------------------------------------------------------

    function PaneShell({ title, t, canClose, onClosePane, paneRef, children }) {
      return h(
        'div',
        { className: 'dsv-pane', ref: paneRef },
        h(
          'div',
          { className: 'dsv-pane-head' },
          h('span', { className: 'dsv-dot', 'aria-hidden': 'true' }),
          h('span', { className: 'dsv-pane-heading' }, h('span', { className: 'dsv-pane-title' }, title)),
          h(
            'span',
            { className: 'dsv-pane-actions' },
            canClose === true && onClosePane !== null && onClosePane !== undefined
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsv-iconbtn dsv-iconbtn--sm',
                    title: t('pane.close'),
                    'aria-label': t('pane.close'),
                    onClick: onClosePane,
                  },
                  h(IconClose, { size: 14 }),
                )
              : null,
          ),
        ),
        h('div', { className: 'dsv-pane-body' }, children),
      );
    }

    function PaneFrame({
      ctx,
      SessionProvider,
      renderSlot,
      sessionId,
      title,
      generation,
      paneIndex,
      paneCount,
      paneRef,
      isCurrent,
      canClose,
      onClosePane,
      onOpenSingle,
      t,
    }) {
      const retained = useSessionReference(ctx, sessionId, generation);
      const close = canClose === true && onClosePane !== null && onClosePane !== undefined;

      if (retained.error !== null) {
        return h(
          PaneShell,
          { title, t, canClose: close, onClosePane, paneRef },
          h(PaneFailure, {
            error: retained.error,
            t,
            onRetry: retained.retry,
            onClose: close ? onClosePane : null,
          }),
        );
      }

      if (retained.reference === null) {
        return h(
          PaneShell,
          { title, t, canClose: close, onClosePane, paneRef },
          h(
            'div',
            { className: 'dsv-pane-loading' },
            h('span', { className: 'dsv-spinner', 'aria-hidden': 'true' }),
            t('pane.loading'),
          ),
        );
      }

      return h(
        PaneBoundary,
        {
          key: `${sessionId}:${generation}:${retained.attempt}:provider`,
          t,
          onRetry: retained.retry,
          onClose: close ? onClosePane : null,
        },
        h(
          SessionProvider,
          {
            key: `${sessionId}:${generation}:${retained.attempt}`,
            session: retained.reference,
            empty: () => null,
          },
          h(PaneOutlet, {
            renderSlot,
            paneIndex,
            paneCount,
            paneRef,
            isCurrent,
            canClose: close,
            onClosePane,
            onOpenSingle,
            onRetry: retained.retry,
          }),
        ),
      );
    }

    function PaneOutlet(props) {
      const { renderSlot } = props;
      return renderSlot('split.conversation.pane', {
        paneIndex: props.paneIndex,
        paneCount: props.paneCount,
        paneRef: props.paneRef,
        isCurrent: props.isCurrent,
        canClose: props.canClose,
        onClosePane: props.onClosePane,
        onOpenSingle: props.onOpenSingle,
        onRetry: props.onRetry,
      });
    }

    // ---------------------------------------------------------------------
    // The split conversation: replaces main.conversation only while active
    // ---------------------------------------------------------------------

    function createSplitConversation(ctx, store) {
      return function SplitConversation({
        sessionId,
        useSessions,
        useWorkspaces,
        renderSlot,
        SessionProvider,
        t,
      }) {
        const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
        const sessions = useSessions((value) => value);
        const workspaces = useWorkspaces((value) => value);

        const companions = state.companions.filter((id) => id !== sessionId);
        const paneCount = sessionId === undefined ? 0 : 1 + companions.length;

        const [fractions, setFractions] = React.useState(() =>
          normalizeFractions(paneCount, state.fractions),
        );
        const fractionsRef = React.useRef(fractions);
        const dragRef = React.useRef(null);
        const [dragging, setDragging] = React.useState(false);
        const gridRef = React.useRef(null);
        const paneRefs = React.useRef(new Map());
        const previousSessionRef = React.useRef(sessionId);
        const pickerRef = React.useRef(null);
        const [pickerOpen, setPickerOpen] = React.useState(false);
        const [notice, setNotice] = React.useState(null);
        const noticeTimer = React.useRef(null);

        const setPaneRef = React.useCallback(
          (id) => (element) => {
            if (element === null) paneRefs.current.delete(id);
            else paneRefs.current.set(id, element);
          },
          [],
        );

        const flash = React.useCallback((message) => {
          setNotice(message);
          if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
          noticeTimer.current = window.setTimeout(() => {
            noticeTimer.current = null;
            setNotice(null);
          }, 2800);
        }, []);

        React.useEffect(() => {
          return () => {
            if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
          };
        }, []);

        React.useEffect(() => {
          if (sessionId !== undefined) return;
          if (state.mode) store.setMode(false);
        }, [sessionId, state.mode, store]);

        // A split with no companion is no longer a split. This mount-only
        // guard handles a stale mode with only the current Session; closing
        // the last companion exits synchronously in closeCompanion below.
        React.useLayoutEffect(() => {
          if (sessionId !== undefined && companions.length === 0) store.setMode(false);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        React.useLayoutEffect(() => {
          if (sessionId === undefined) return;
          const previous = previousSessionRef.current;
          previousSessionRef.current = sessionId;
          if (previous === sessionId) {
            if (store.hasCompanion(sessionId)) store.removeCompanion(sessionId);
            return;
          }
          if (previous === undefined) {
            if (store.hasCompanion(sessionId)) store.removeCompanion(sessionId);
            return;
          }
          // The sidebar changes the current Session without leaving split
          // mode. If the arriving Session was a companion, swap it with the
          // outgoing current one so the visible set stays intact; otherwise
          // keep the outgoing current Session as a companion when there is
          // room.
          if (store.hasCompanion(sessionId)) {
            store.replaceCompanion(sessionId, previous);
          } else if (!store.hasCompanion(previous)) {
            store.addCompanion(previous);
          }
        }, [sessionId, store]);

        React.useLayoutEffect(() => {
          const next = normalizeFractions(paneCount, state.fractions);
          fractionsRef.current = next;
          setFractions(next);
        }, [paneCount, state.fractions]);

        React.useEffect(() => {
          if (!pickerOpen) return undefined;
          const onPointerDown = (event) => {
            if (pickerRef.current !== null && !pickerRef.current.contains(event.target)) {
              setPickerOpen(false);
            }
          };
          const onKeyDown = (event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setPickerOpen(false);
            }
          };
          document.addEventListener('pointerdown', onPointerDown, true);
          document.addEventListener('keydown', onKeyDown, true);
          return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown, true);
          };
        }, [pickerOpen]);

        const openIds = React.useMemo(
          () => new Set(sessionId === undefined ? [] : [sessionId, ...companions]),
          [sessionId, companions],
        );

        const focusPane = React.useCallback((id) => {
          const element = paneRefs.current.get(id);
          if (element !== undefined) element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }, []);

        const addSession = React.useCallback(
          (id) => {
            if (sessionId === undefined) return;
            if (id === sessionId) {
              setPickerOpen(false);
              return;
            }
            if (companions.includes(id)) {
              setPickerOpen(false);
              focusPane(id);
              return;
            }
            if (companions.length >= MAX_COMPANIONS) {
              flash(t('panel.limit', { count: MAX_SESSIONS }));
              return;
            }
            store.addCompanion(id);
            setPickerOpen(false);
          },
          [companions, flash, focusPane, sessionId, store, t],
        );

        const updateFractions = React.useCallback((next) => {
          fractionsRef.current = next;
          setFractions(next);
        }, []);

        const beginDrag = React.useCallback(
          (index, event) => {
            if (typeof event.button === 'number' && event.button !== 0) return;
            const grid = gridRef.current;
            if (grid === null) return;
            event.preventDefault();
            const padding = 20;
            const dividers = Math.max(0, paneCount - 1) * 6;
            const width = Math.max(1, grid.clientWidth - padding - dividers);
            dragRef.current = {
              index,
              startX: event.clientX,
              width,
              start: fractionsRef.current.slice(),
            };
            setDragging(true);
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch (_error) {
              // Pointer capture is an enhancement; the drag still settles on pointerup.
            }
          },
          [paneCount],
        );

        const moveDrag = React.useCallback(
          (event) => {
            const drag = dragRef.current;
            if (drag === null) return;
            const delta = (event.clientX - drag.startX) / drag.width;
            const next = drag.start.slice();
            const min = 0.2;
            let left = drag.start[drag.index] + delta;
            let right = drag.start[drag.index + 1] - delta;
            if (left < min) {
              right -= min - left;
              left = min;
            }
            if (right < min) {
              left -= min - right;
              right = min;
            }
            next[drag.index] = left;
            next[drag.index + 1] = right;
            updateFractions(next);
          },
          [updateFractions],
        );

        const endDrag = React.useCallback(() => {
          if (dragRef.current === null) return;
          dragRef.current = null;
          setDragging(false);
          store.setFractions(fractionsRef.current);
        }, [store]);

        if (sessionId === undefined) return null;

        const closeCompanion = (id) => {
          const remaining = state.companions.filter(
            (candidate) => candidate !== sessionId && candidate !== id,
          );
          store.removeCompanion(id);
          if (remaining.length === 0) store.setMode(false);
        };

        const horizontal = paneCount <= 3;
        const gridStyle = horizontal
          ? { gridTemplateColumns: buildColumns(paneCount, fractions) }
          : {
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)',
            };

        const currentTitle = titleOf(sessions.byId?.[sessionId], sessionId, t);

        const paneNodes = [
          h(PaneFrame, {
            key: 'pane:current',
            ctx,
            SessionProvider,
            renderSlot,
            sessionId,
            title: currentTitle,
            generation: state.generation,
            paneIndex: 0,
            paneCount,
            paneRef: setPaneRef(sessionId),
            isCurrent: true,
            canClose: false,
            onClosePane: null,
            onOpenSingle: null,
            t,
          }),
        ];

        companions.forEach((id, index) => {
          paneNodes.push(
            h(PaneFrame, {
              key: `pane:${id}`,
              ctx,
              SessionProvider,
              renderSlot,
              sessionId: id,
              title: titleOf(sessions.byId?.[id], id, t),
              generation: state.generation,
              paneIndex: index + 1,
              paneCount,
              paneRef: setPaneRef(id),
              isCurrent: false,
              canClose: true,
              onClosePane: () => closeCompanion(id),
              onOpenSingle: () => {
                try {
                  store.setMode(false);
                  ctx.uiWorkspace.openSession(id);
                } catch (error) {
                  console.warn('[split-view] could not open the session in single view:', error);
                }
              },
              t,
            }),
          );
        });

        const gridChildren = [];
        paneNodes.forEach((node, index) => {
          gridChildren.push(node);
          if (horizontal && index < paneNodes.length - 1) {
            gridChildren.push(
              h('div', {
                key: `divider:${index}`,
                className: 'dsv-divider',
                role: 'separator',
                'aria-orientation': 'vertical',
                'aria-label': t('divider.resize'),
                'data-dragging':
                  dragging && dragRef.current !== null && dragRef.current.index === index ? 'true' : 'false',
                onPointerDown: (event) => beginDrag(index, event),
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
                onLostPointerCapture: endDrag,
              }),
            );
          }
        });

        return h(
          'div',
          { className: 'dsv-panel', 'data-split-view': 'conversation' },
          h(
            'div',
            { className: 'dsv-topbar', 'data-window-drag': '' },
            h(
              'div',
              { className: 'dsv-heading' },
              h(IconSplit, { size: 16, className: 'dsv-heading-icon' }),
              h('span', { className: 'dsv-title' }, t('panel.title')),
              h('span', { className: 'dsv-count' }, t('panel.count', { count: companions.length + 1 })),
            ),
            notice !== null
              ? h('span', { className: 'dsv-notice', role: 'status', 'aria-live': 'polite' }, notice)
              : null,
            h('span', { className: 'dsv-spacer' }),
            h(
              'div',
              { className: 'dsv-picker-anchor', ref: pickerRef },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsv-btn',
                  onClick: () => setPickerOpen((value) => !value),
                  'aria-haspopup': 'dialog',
                  'aria-expanded': pickerOpen ? 'true' : 'false',
                  title: t('panel.add'),
                },
                h(IconPlus, { size: 14 }),
                h('span', { className: 'dsv-btn-label' }, t('panel.add')),
              ),
              pickerOpen
                ? h(
                    'div',
                    { className: 'dsv-picker', role: 'dialog', 'aria-label': t('picker.title') },
                    h(
                      'div',
                      { className: 'dsv-picker-head' },
                      h('span', { className: 'dsv-picker-title' }, t('picker.title')),
                    ),
                    h(SessionPicker, {
                      sessions,
                      workspaces,
                      t,
                      openIds,
                      onPick: addSession,
                      autoFocus: true,
                    }),
                  )
                : null,
            ),
            h(
              'button',
              { type: 'button', className: 'dsv-btn dsv-btn--quiet', onClick: () => store.setMode(false), title: t('panel.exit') },
              h(IconClose, { size: 14 }),
              h('span', { className: 'dsv-btn-label' }, t('panel.exit')),
            ),
          ),
          h(
            'div',
            {
              className: horizontal ? 'dsv-grid dsv-grid--horizontal' : 'dsv-grid dsv-grid--quad',
              style: gridStyle,
              ref: gridRef,
              role: 'group',
              'aria-label': `${t('panel.title')} — ${currentTitle}`,
            },
            gridChildren,
          ),
        );
      };
    }

    function buildColumns(count, fractions) {
      if (count <= 0) return '1fr';
      if (count === 1) return 'minmax(0, 1fr)';
      const parts = [];
      for (let index = 0; index < count; index += 1) {
        if (index > 0) parts.push('6px');
        const fraction = Math.max(0.15, fractions[index] ?? 1 / count);
        parts.push(`minmax(0, ${fraction.toFixed(5)}fr)`);
      }
      return parts.join(' ');
    }

    // ---------------------------------------------------------------------
    // Header entry, session-row entry, stale-panel migration
    // ---------------------------------------------------------------------

    function createHeaderAction(store) {
      return function HeaderSplitAction({ sessionId, useSessions, useWorkspaces, t }) {
        const sessions = useSessions((value) => value);
        const workspaces = useWorkspaces((value) => value);
        const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
        const buttonRef = React.useRef(null);
        const [open, setOpen] = React.useState(false);
        const [notice, setNotice] = React.useState(null);

        const companions = state.companions.filter((id) => id !== sessionId);
        const openIds = React.useMemo(
          () => new Set([sessionId, ...companions]),
          [sessionId, companions],
        );

        const close = React.useCallback(() => {
          setOpen(false);
          setNotice(null);
        }, []);

        const handleClick = () => {
          if (open) {
            close();
            return;
          }
          setNotice(null);
          setOpen(true);
        };

        const handlePick = (id) => {
          if (id === sessionId) {
            if (companions.length === 0) {
              close();
              return;
            }
            store.setMode(true);
            close();
            return;
          }
          if (state.companions.includes(id)) {
            store.setMode(true);
            close();
            return;
          }
          if (companions.length >= MAX_COMPANIONS) {
            setNotice(t('panel.limit', { count: MAX_SESSIONS }));
            return;
          }
          store.addCompanion(id);
          store.setMode(true);
          close();
        };

        if (sessions.byId?.[sessionId]?.origin === 'subagent') return null;

        return h(
          React.Fragment,
          null,
          h(
            'button',
            {
              ref: buttonRef,
              type: 'button',
              className: 'dsv-iconbtn dsv-header-action',
              title: t('action.split'),
              'aria-label': t('action.split'),
              'aria-haspopup': 'dialog',
              'aria-expanded': open ? 'true' : 'false',
              onClick: handleClick,
            },
            h(IconSplit, { size: 16 }),
          ),
          h(AnchoredSessionPicker, {
            open,
            anchorRef: buttonRef,
            onClose: close,
            sessions,
            workspaces,
            t,
            openIds,
            onPick: handlePick,
            notice,
          }),
        );
      };
    }

    function createSidebarAction(ctx, store) {
      return function SidebarSplitAction({ wide, useSessions, useWorkspaces, t }) {
        const sessions = useSessions((value) => value);
        const workspaces = useWorkspaces((value) => value);
        const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
        const buttonRef = React.useRef(null);
        const [open, setOpen] = React.useState(false);
        const [notice, setNotice] = React.useState(null);

        const entries = Object.entries(sessions.byId ?? {});
        const found = entries.find(([, row]) => (row?.retainedBy?.mainView ?? 0) > 0);
        const mainId = found === undefined ? undefined : found[0];
        const companions = state.companions.filter((id) => id !== mainId);
        const openIds = React.useMemo(
          () => new Set(mainId === undefined ? [] : [mainId, ...companions]),
          [mainId, companions],
        );

        const close = React.useCallback(() => {
          setOpen(false);
          setNotice(null);
        }, []);

        React.useEffect(() => {
          if (mainId === undefined && open) close();
        }, [mainId, open, close]);

        if (mainId === undefined) return null;

        const handleClick = () => {
          if (open) {
            close();
            return;
          }
          setNotice(null);
          setOpen(true);
        };

        const handlePick = (id) => {
          if (id === mainId) {
            if (companions.length === 0) {
              try {
                ctx.layout.selectPanel(null);
              } catch (error) {
                console.warn('[split-view] could not show the conversation:', error);
              }
              close();
              return;
            }
            store.setMode(true);
            try {
              ctx.layout.selectPanel(null);
            } catch (error) {
              console.warn('[split-view] could not show the conversation:', error);
            }
            close();
            return;
          }
          if (state.companions.includes(id)) {
            store.setMode(true);
            try {
              ctx.layout.selectPanel(null);
            } catch (error) {
              console.warn('[split-view] could not show the conversation:', error);
            }
            close();
            return;
          }
          if (companions.length >= MAX_COMPANIONS) {
            setNotice(t('panel.limit', { count: MAX_SESSIONS }));
            return;
          }
          store.addCompanion(id);
          store.setMode(true);
          try {
            ctx.layout.selectPanel(null);
          } catch (error) {
            console.warn('[split-view] could not show the conversation:', error);
          }
          close();
        };

        return h(
          React.Fragment,
          null,
          h(
            'button',
            {
              ref: buttonRef,
              type: 'button',
              className: 'dsv-iconbtn dsv-footer-action',
              title: t('action.split'),
              'aria-label': t('action.split'),
              'aria-haspopup': 'dialog',
              'aria-expanded': open ? 'true' : 'false',
              onClick: handleClick,
            },
            h(IconSplit, { size: wide === true ? 16 : 18 }),
          ),
          h(AnchoredSessionPicker, {
            open,
            anchorRef: buttonRef,
            onClose: close,
            sessions,
            workspaces,
            t,
            openIds,
            onPick: handlePick,
            notice,
          }),
        );
      };
    }

    function createRowAction(ctx, store) {
      function CurrentRowSplitAction({ sessionId, useSessions, useWorkspaces, t }) {
        const sessions = useSessions((value) => value);
        const workspaces = useWorkspaces((value) => value);
        const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
        const buttonRef = React.useRef(null);
        const [open, setOpen] = React.useState(false);
        const [notice, setNotice] = React.useState(null);

        const companions = state.companions.filter((id) => id !== sessionId);
        const openIds = React.useMemo(() => new Set([sessionId, ...companions]), [sessionId, companions]);

        const close = React.useCallback(() => {
          setOpen(false);
          setNotice(null);
        }, []);

        const handleClick = () => {
          if (open) {
            close();
            return;
          }
          setNotice(null);
          setOpen(true);
        };

        const handlePick = (id) => {
          if (id === sessionId) {
            if (companions.length === 0) {
              try {
                ctx.layout.selectPanel(null);
              } catch (error) {
                console.warn('[split-view] could not show the conversation:', error);
              }
              close();
              return;
            }
            store.setMode(true);
            try {
              ctx.layout.selectPanel(null);
            } catch (error) {
              console.warn('[split-view] could not show the conversation:', error);
            }
            close();
            return;
          }
          if (state.companions.includes(id)) {
            store.setMode(true);
            try {
              ctx.layout.selectPanel(null);
            } catch (error) {
              console.warn('[split-view] could not show the conversation:', error);
            }
            close();
            return;
          }
          if (companions.length >= MAX_COMPANIONS) {
            setNotice(t('panel.limit', { count: MAX_SESSIONS }));
            return;
          }
          store.addCompanion(id);
          store.setMode(true);
          try {
            ctx.layout.selectPanel(null);
          } catch (error) {
            console.warn('[split-view] could not show the conversation:', error);
          }
          close();
        };

        return h(
          React.Fragment,
          null,
          h(
            'button',
            {
              ref: buttonRef,
              type: 'button',
              className: 'dsv-row-action',
              title: t('action.split'),
              'aria-label': t('action.split'),
              'aria-haspopup': 'dialog',
              'aria-expanded': open ? 'true' : 'false',
              onClick: handleClick,
            },
            h(IconSplit, { size: 14 }),
          ),
          h(AnchoredSessionPicker, {
            open,
            anchorRef: buttonRef,
            onClose: close,
            sessions,
            workspaces,
            t,
            openIds,
            onPick: handlePick,
            notice,
          }),
        );
      }

      return function RowSplitAction({ sessionId, useSessions, useWorkspaces, t }) {
        const isCurrent = useSessions(
          (value) => (value.byId[sessionId]?.retainedBy?.mainView ?? 0) > 0,
        );
        if (isCurrent) {
          return h(CurrentRowSplitAction, {
            sessionId,
            useSessions,
            useWorkspaces,
            t,
          });
        }
        const handleClick = () => {
          const list = ctx.sessions.list.getSnapshot();
          const current = Object.entries(list.byId ?? {}).find(
            ([, row]) => (row?.retainedBy?.mainView ?? 0) > 0,
          );
          if (current === undefined) {
            try {
              ctx.uiWorkspace.openSession(sessionId);
            } catch (error) {
              console.warn('[split-view] could not open the session:', error);
            }
            return;
          }
          store.addCompanion(sessionId);
          store.setMode(true);
          try {
            ctx.layout.selectPanel(null);
          } catch (error) {
            console.warn('[split-view] could not show the conversation:', error);
          }
        };
        return h(
          'button',
          {
            type: 'button',
            className: 'dsv-row-action',
            title: t('action.openInSplit'),
            'aria-label': t('action.openInSplit'),
            onClick: handleClick,
          },
          h(IconSplit, { size: 14 }),
        );
      };
    }

    function createMigrationShim(ctx) {
      // The first version exposed a global "split" main panel. When this
      // version replaces it while that panel is selected, the main key no
      // longer exists; return the user to the Conversation instead of leaving
      // an empty centre column.
      return function SplitViewMigration({ usePanelInfo }) {
        const active = usePanelInfo((info) => info.activePanelId);
        React.useEffect(() => {
          if (active !== 'split') return;
          try {
            ctx.layout.selectPanel(null);
          } catch (error) {
            console.warn('[split-view] could not leave the retired split panel:', error);
          }
        }, [active]);
        return null;
      };
    }

    // ---------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------

    const CSS = `
.dsv-panel{height:100%;min-width:0;min-height:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;container-type:inline-size;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);}
.dsv-topbar{-webkit-app-region:drag;flex:none;min-height:56px;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:8px 16px 8px max(16px,calc(var(--dsh-frame-leading-clearance,0px) + 10px));border-bottom:.5px solid var(--dsw-alias-border-l1);}
.dsv-topbar button,.dsv-topbar input,.dsv-topbar .dsv-picker{-webkit-app-region:no-drag;}
.dsv-heading{flex:0 1 auto;display:flex;align-items:center;gap:8px;min-width:0;}
.dsv-heading-icon{color:var(--dsw-alias-label-secondary);flex:none;}
.dsv-title{font-size:14px;line-height:20px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsv-count{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent);border-radius:999px;padding:0 8px;white-space:nowrap;}
.dsv-spacer{flex:1;min-width:8px;}
.dsv-notice{font-size:12px;line-height:18px;color:var(--dsw-alias-state-warn-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38%;}
.dsv-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 10px;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;line-height:18px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .12s ease,border-color .12s ease;}
.dsv-btn:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent);}
.dsv-btn:active{background:color-mix(in srgb,var(--dsw-alias-label-primary) 11%,transparent);}
.dsv-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.dsv-btn--quiet{border-color:transparent;color:var(--dsw-alias-label-secondary);}
.dsv-btn--quiet:hover{color:var(--dsw-alias-label-primary);}
.dsv-iconbtn{width:28px;height:28px;box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:.5px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .12s ease,color .12s ease;}
.dsv-iconbtn:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary);}
.dsv-iconbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.dsv-iconbtn--sm{width:24px;height:24px;border-radius:6px;}
.dsv-header-action{margin:0;}
.dsv-row-action{width:22px;height:22px;box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:.5px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;margin-left:2px;}
.dsv-row-action:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary);}
.dsv-row-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.dsv-picker-anchor{position:relative;display:inline-flex;flex:none;}
.dsv-picker--anchored{right:auto;}
.dsv-picker-notice{display:block;margin-top:4px;font-size:11px;line-height:15px;color:var(--dsw-alias-state-warn-primary);}
.dsv-picker{position:absolute;top:calc(100% + 12px);right:0;z-index:30;width:min(360px,calc(100vw - 48px));max-height:min(480px,calc(100vh - 160px));display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 14px 34px color-mix(in srgb,#000 18%,transparent);}
.dsv-picker-head{flex:none;padding:10px 12px 8px;border-bottom:.5px solid var(--dsw-alias-border-l1);}
.dsv-picker-title{font-size:12px;line-height:16px;font-weight:600;color:var(--dsw-alias-label-secondary);}
.dsv-picker-body{flex:1;min-height:0;display:flex;flex-direction:column;}
.dsv-search{flex:none;display:flex;align-items:center;gap:6px;height:30px;box-sizing:border-box;margin:8px 8px 4px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);}
.dsv-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;line-height:18px;}
.dsv-search input::placeholder{color:var(--dsw-alias-label-secondary);}
.dsv-picker-list{min-height:0;overflow-y:auto;padding:4px 6px 6px;display:flex;flex-direction:column;gap:2px;}
.dsv-picker-empty{padding:18px 10px;text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary);}
.dsv-picker-foot{flex:none;padding:6px 12px 8px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:11px;line-height:16px;color:var(--dsw-alias-state-warn-primary);}
.dsv-pick-row{width:100%;box-sizing:border-box;display:flex;align-items:center;gap:9px;min-height:40px;padding:4px 8px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;text-align:left;cursor:pointer;}
.dsv-pick-row:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent);}
.dsv-pick-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px;}
.dsv-pick-row--open{color:var(--dsw-alias-label-secondary);}
.dsv-pick-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.dsv-pick-title{font-size:12.5px;line-height:17px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsv-pick-meta{display:flex;align-items:center;gap:5px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsv-pick-sep{opacity:.5;}
.dsv-pick-state{flex:none;display:inline-flex;align-items:center;gap:3px;font-size:10.5px;line-height:14px;color:var(--dsw-alias-label-secondary);}
.dsv-grid{flex:1;min-width:0;min-height:0;display:grid;padding:10px;box-sizing:border-box;}
.dsv-grid--horizontal{gap:0;}
.dsv-grid--quad{gap:10px;}
.dsv-pane{min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;}
.dsv-pane[data-current="true"]{border-color:var(--dsw-alias-border-l2);}
.dsv-pane-head{flex:none;min-height:40px;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:0 6px 0 12px;border-bottom:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);}
.dsv-pane-heading{flex:1;min-width:0;display:flex;flex-direction:column;gap:0;padding:5px 0;}
.dsv-pane-title{font-size:12.5px;line-height:16px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsv-pane-meta{display:flex;align-items:center;gap:6px;font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsv-pane-index{opacity:.6;}
.dsv-pane-id{opacity:.65;}
.dsv-current-badge{flex:none;font-size:10px;line-height:14px;font-weight:500;color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);border-radius:999px;padding:0 6px;}
.dsv-pane-actions{flex:none;display:flex;align-items:center;gap:1px;opacity:.55;transition:opacity .12s ease;}
.dsv-pane:hover .dsv-pane-actions,.dsv-pane:focus-within .dsv-pane-actions{opacity:1;}
.dsv-pane-body{flex:1;min-width:0;min-height:0;display:flex;overflow:hidden;}
.dsv-pane-body>*{flex:1;min-width:0;min-height:0;}
.dsv-dot{width:6px;height:6px;border-radius:50%;flex:none;background:var(--dsw-alias-state-idle-primary);opacity:.7;}
.dsv-dot--running{background:var(--dsw-alias-brand-primary);opacity:1;animation:dsv-pulse 1.4s ease-in-out infinite;}
@keyframes dsv-pulse{0%,100%{opacity:.45;transform:scale(.86);}50%{opacity:1;transform:scale(1);}}
.dsv-divider{width:6px;position:relative;cursor:col-resize;align-self:stretch;touch-action:none;}
.dsv-divider::after{content:"";position:absolute;top:12px;bottom:12px;left:calc(50% - .5px);width:1px;border-radius:1px;background:var(--dsw-alias-border-l1);transition:background .12s ease,top .12s ease,bottom .12s ease;}
.dsv-divider:hover::after,.dsv-divider[data-dragging="true"]::after{background:var(--dsw-alias-brand-primary);top:0;bottom:0;}
.dsv-pane-loading{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:var(--dsw-alias-label-secondary);}
.dsv-spinner{width:14px;height:14px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent);border-top-color:var(--dsw-alias-brand-primary);animation:dsv-spin .8s linear infinite;}
@keyframes dsv-spin{to{transform:rotate(360deg);}}
.dsv-failure{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;text-align:center;color:var(--dsw-alias-label-secondary);}
.dsv-failure-title{font-size:13px;line-height:19px;font-weight:600;color:var(--dsw-alias-label-primary);}
.dsv-failure-body{max-width:min(420px,100%);font-size:11.5px;line-height:17px;word-break:break-word;color:var(--dsw-alias-label-secondary);}
.dsv-failure-actions{display:flex;align-items:center;gap:6px;margin-top:2px;}
.dsv-failure .dsv-btn{height:26px;font-size:11.5px;}
@media (prefers-reduced-motion:reduce){.dsv-dot--running,.dsv-spinner{animation:none;}.dsv-divider::after,.dsv-pane-actions,.dsv-btn{transition:none;}}
@container (max-width:640px){.dsv-btn-label{display:none;}.dsv-btn{padding:0 8px;}.dsv-title{font-size:13px;}.dsv-count{display:none;}.dsv-topbar{padding:8px 10px 8px max(10px,calc(var(--dsh-frame-leading-clearance,0px) + 6px));gap:6px;}}
`;

    const CSS_TAG = 'dsh-session-split-view/split-view.css';

    // ---------------------------------------------------------------------
    // Client plugin
    // ---------------------------------------------------------------------

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'split-view: dictionaries');

      ctx.effect(() => {
        if (typeof document === 'undefined') return () => {};
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-session-split-view';
        tag.dataset.pluginCss = CSS_TAG;
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          tag.remove();
        };
      }, 'split-view: stylesheet');

      const store = createStore(ctx);

      ctx.effect(
        () =>
          ctx.on('connection/reset', () => {
            store.bumpGeneration();
          }),
        'split-view: session references across reconnects',
      );

      const SplitPane = createPaneComponent();
      const SplitConversation = createSplitConversation(ctx, store);
      const HeaderSplitAction = createHeaderAction(store);
      const RowSplitAction = createRowAction(ctx, store);
      const SidebarSplitAction = createSidebarAction(ctx, store);
      const SplitViewMigration = createMigrationShim(ctx);

      // Split mode is a mode of the Conversation, not another main panel: the
      // sidebar keeps the current Session selected, the right Sidebar keeps its
      // track, and normal conversation rendering is untouched while inactive.
      // While active, a priority -10 entry shadows the shipped
      // main.conversation occupant; disposing it reveals the shipped shell.
      ctx.effect(
        () =>
          ctx.slots.inject('main.conversation', () => {
            let registration = null;
            const sync = () => {
              const active = store.getSnapshot().mode;
              if (active && registration === null) {
                try {
                  registration = ctx.slots.register(
                    {
                      name: 'main.conversation',
                      priority: -10,
                      locale: NS,
                      children: {
                        'split.conversation.pane': { kind: 'single', scope: 'session' },
                      },
                    },
                    SplitConversation,
                  );
                } catch (error) {
                  console.error('[split-view] could not enter split mode:', error);
                  store.setMode(false);
                }
              } else if (!active && registration !== null) {
                const dispose = registration;
                registration = null;
                dispose();
              }
            };
            sync();
            const unsubscribe = store.subscribe(sync);
            return () => {
              unsubscribe();
              if (registration !== null) {
                const dispose = registration;
                registration = null;
                dispose();
              }
            };
          }),
        'split-view: split conversation mode',
      );

      ctx.effect(
        () =>
          ctx.slots.inject('split.conversation.pane', () =>
            ctx.slots.register({ name: 'split.conversation.pane', locale: NS }, SplitPane),
          ),
        'split-view: pane conversation',
      );

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.footer.action', () =>
            ctx.slots.register(
              {
                name: 'sidebar.footer.action',
                id: 'split-view',
                order: 0,
                locale: NS,
              },
              SidebarSplitAction,
            ),
          ),
        'split-view: sidebar action',
      );

      ctx.effect(
        () =>
          ctx.slots.inject('conversation.session.header.utilities', () =>
            ctx.slots.register(
              {
                name: 'conversation.session.header.utilities',
                id: 'split-view',
                order: 40,
                locale: NS,
              },
              HeaderSplitAction,
            ),
          ),
        'split-view: header action',
      );

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.workspaces.session.row.action', () =>
            ctx.slots.register(
              {
                name: 'sidebar.workspaces.session.row.action',
                id: 'split-view',
                order: 40,
                locale: NS,
              },
              RowSplitAction,
            ),
          ),
        'split-view: session row action',
      );

      ctx.effect(
        () =>
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              { name: 'shell.overlay', id: 'split-view-migrate', order: 0 },
              SplitViewMigration,
            ),
          ),
        'split-view: retired panel migration',
      );
    }

    return {
      inject: ['slots', 'layout', 'locale', 'sessions', 'uiWorkspace'],
      apply,
    };
  },
});
