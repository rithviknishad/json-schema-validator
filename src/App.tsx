import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { json } from "@codemirror/lang-json";
import { githubLight } from "@uiw/codemirror-theme-github";
import ReactCodeMirror from "@uiw/react-codemirror";
import { useAtom } from "jotai";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
  PlayCircleIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import Ajv from "ajv";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { appStateAtom } from "@/lib/atoms";

function App() {
  const [state, setState] = useAtom(appStateAtom);
  const [validatedSchema, setValidatedSchema] = useState<object>();
  const [jsonError, setJsonError] = useState<string>();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel className="h-screen">
        <div className="pl-4 pt-4">
          <span className="font-bold">JSON Schema</span>
        </div>
        <div
          className={cn(
            "m-2 mb-0 rounded-lg overflow-hidden border-2",
            jsonError && "border-destructive"
          )}
        >
          <ReactCodeMirror
            className="h-full"
            value={state.schema}
            onChange={(content) => {
              setJsonError(undefined);
              setState((s) => ({ ...s, content }));
              try {
                const schema = JSON.parse(content);
                setValidatedSchema(schema);
              } catch (e) {
                setJsonError(`${e}`);
                console.error(e);
              }
            }}
            minHeight="8rem"
            height="100%"
            maxHeight="90vh"
            theme={githubLight}
            extensions={[json()]}
          />
        </div>
        {jsonError && (
          <span className="px-2 text-xs font-medium text-destructive">
            {jsonError}
          </span>
        )}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <div className="flex justify-between px-4 pt-4">
          <span className="font-bold">Tests</span>
          <Button
            onClick={() => {
              try {
                const ajv = new Ajv({ allErrors: true });
                const schema = JSON.parse(state.schema);
                if (ajv.validateSchema(schema)) {
                  setValidatedSchema(schema);
                  return;
                }
              } catch (e) {
                console.error(e);
                toast.error(`${e}`, { duration: 10e3 });
              }

              setValidatedSchema(undefined);
            }}
          >
            <PlayCircleIcon size={18} />
            <span className="pl-2">Test</span>
          </Button>
        </div>
        <ul className="flex flex-col gap-3 overflow-y-auto p-2">
          {state.tests.map((test, idx) => (
            <li key={idx}>
              <TestEntry
                index={idx}
                schema={validatedSchema}
                test={test}
                onRemove={() =>
                  setState((s) => ({
                    ...s,
                    tests: state.tests.filter((_, i) => i !== idx),
                  }))
                }
                onUpdate={(updated) =>
                  setState((s) => ({
                    ...s,
                    tests: state.tests.map((existing, i) =>
                      i === idx ? updated : existing
                    ),
                  }))
                }
              />
            </li>
          ))}
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setState((s) => ({ ...s, tests: [...state.tests, ""] }))
              }
            >
              <PlusCircleIcon size={18} />
              <span className="pl-2">Add Test</span>
            </Button>
          </div>
        </ul>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;

type TestEntryProps = {
  index: number;
  schema?: object;
  test: string;
  onRemove: () => void;
  onUpdate: (value: string) => void;
};

const TestEntry = ({
  index,
  schema,
  test,
  onRemove,
  onUpdate,
}: TestEntryProps) => {
  const testCase = useMemo(() => {
    try {
      const obj = JSON.parse(test);
      return { obj, error: null };
    } catch (e) {
      return { obj: null, error: `${e}` };
    }
  }, [test]);

  const result = useMemo(() => {
    if (!schema || !testCase.obj) {
      return;
    }

    const ajv = new Ajv({ allErrors: true });

    const isValid = ajv.validate(schema, testCase.obj);

    return {
      isValid,
      errors: ajv.errors,
    };
  }, [schema, testCase.obj]);

  return (
    <div className="rounded-lg flex gap-1">
      <div className="flex flex-col gap-2 items-center">
        <Button variant="outline" size="icon" onClick={onRemove}>
          <CircleMinusIcon size={16} />
        </Button>
        <span className="font-bold text-muted-foreground tracking-widest">
          #{index + 1}
        </span>
        {testCase.error && (
          <span className="text-destructive">
            <CircleAlertIcon />
          </span>
        )}
        {result && (
          <>
            {result.isValid ? (
              <span className="text-green-500">
                <CircleCheckIcon />
              </span>
            ) : (
              <span className="text-destructive">
                <CircleXIcon />
              </span>
            )}
          </>
        )}
      </div>
      <div
        className={cn(
          "border-2 rounded-lg overflow-hidden w-full",
          (testCase.error || result?.errors) && "border-destructive",
          result?.isValid && "border-green-500"
        )}
      >
        <ReactCodeMirror
          className="w-full"
          value={test}
          onChange={onUpdate}
          minHeight="4rem"
          height="100%"
          maxHeight="16rem"
          theme={githubLight}
          extensions={[json()]}
        />
        {testCase.error && (
          <div className="bg-destructive/5 p-2 rounded-b-lg">
            <code className="text-xs/tight font-medium text-destructive whitespace-pre-wrap">
              {testCase.error}
            </code>
          </div>
        )}
        {result?.errors && (
          <div className="bg-destructive/5 p-2 rounded-b-lg">
            <code className="text-xs/tight font-medium text-destructive whitespace-pre-wrap">
              {JSON.stringify(result.errors, undefined, "  ")}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};
