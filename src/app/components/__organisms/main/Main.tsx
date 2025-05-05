"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Task {
  text: string;
  done: boolean;
}

interface CollorArr {
  color: string;
  arr: Task[];
}

function Main() {
  const [popup, setPopup] = useState(false);
  const [inputs, setInputs] = useState<CollorArr[]>([]);
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<{
    inputIndex: number;
    taskIndex: number;
    value: string;
  } | null>(null);
  const [draggedTask, setDraggedTask] = useState<{
    task: Task;
    fromIndex: number;
    taskIndex: number;
  } | null>(null);
  const [mount, setMount] = useState(false);

  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const storedInputs = localStorage.getItem("inputs");
    if (storedInputs) {
      setInputs(JSON.parse(storedInputs));
    }
    const storedValues = localStorage.getItem("inputvalues");
    if (storedValues) {
      setInputValues(JSON.parse(storedValues));
    }
    setMount(true);
  }, []);

  useEffect(() => {
    if (mount) {
      localStorage.setItem("inputs", JSON.stringify(inputs));
      localStorage.setItem("inputvalues", JSON.stringify(inputValues));
    }
  }, [inputs, inputValues]);

  const togglePopup = () => setPopup(!popup);

  const addTask = (color: string) => {
    setInputs([...inputs, { color, arr: [] }]);
    setInputValues([...inputValues, ""]);
  };

  const deleteInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
    setInputValues(inputValues.filter((_, i) => i !== index));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newValues = [...inputValues];
    newValues[index] = e.target.value;
    setInputValues(newValues);
  };

  const handleAddText = (index: number) => {
    const updatedInputs = [...inputs];
    const newText = inputValues[index].trim();
    if (newText !== "") {
      updatedInputs[index].arr.push({ text: newText, done: false });
      setInputs(updatedInputs);
      const updatedValues = [...inputValues];
      updatedValues[index] = "";
      setInputValues(updatedValues);
    }
  };

  const deleteTask = (inputIndex: number, taskIndex: number) => {
    const updatedInputs = [...inputs];
    updatedInputs[inputIndex].arr.splice(taskIndex, 1);
    setInputs(updatedInputs);
  };

  const startEditing = (
    inputIndex: number,
    taskIndex: number,
    text: string
  ) => {
    setEditingTask({ inputIndex, taskIndex, value: text });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingTask) {
      setEditingTask({ ...editingTask, value: e.target.value });
    }
  };

  const saveEdit = () => {
    if (editingTask) {
      const updatedInputs = [...inputs];
      updatedInputs[editingTask.inputIndex].arr[editingTask.taskIndex].text =
        editingTask.value;
      setInputs(updatedInputs);
      setEditingTask(null);
    }
  };

  const cancelEdit = () => setEditingTask(null);

  const toggleDone = (inputIndex: number, taskIndex: number) => {
    const updatedInputs = [...inputs];
    updatedInputs[inputIndex].arr[taskIndex].done =
      !updatedInputs[inputIndex].arr[taskIndex].done;
    setInputs(updatedInputs);
  };

  const downloadTasks = (index: number) => {
    const tasks = inputs[index].arr
      .map((task, i) => `${i + 1}. ${task.text}${task.done ? " [Done]" : ""}`)
      .join("\n");
    const blob = new Blob([tasks], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks-${index + 1}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!draggedTask) return;

    const { clientX, clientY } = e;

    for (let i = 0; i < containerRefs.current.length; i++) {
      const container = containerRefs.current[i];
      if (!container || i === draggedTask.fromIndex) continue;

      const rect = container.getBoundingClientRect();

      const isInside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (isInside) {
        const updatedInputs = [...inputs];
        updatedInputs[draggedTask.fromIndex].arr.splice(
          draggedTask.taskIndex,
          1
        );
        updatedInputs[i].arr.push(draggedTask.task);
        setInputs(updatedInputs);
        setDraggedTask(null);
        break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleDrag);
    return () => {
      window.removeEventListener("mousemove", handleDrag);
    };
  }, [draggedTask, inputs]);

  return (
    <div className="w-full min-h-screen p-5 flex flex-wrap gap-4">
      {inputs.map((input, index) => (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          layout
          key={index}
          ref={(el) => {
            containerRefs.current[index] = el as HTMLDivElement | null;
          }}
          style={{ backgroundColor: input.color }}
          className="w-[300px] h-[250px] overflow-auto rounded-[15px] flex flex-col px-5 py-4 items-center shadow-xl relative"
        >
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => downloadTasks(index)}
              className="bg-white text-xs px-2 py-1 rounded shadow self-start mb-2"
            >
              Download
            </button>
            <button
              onClick={() => deleteInput(index)}
              className="w-[24px] h-[24px] rounded-[50%] border border-black flex items-center justify-center bg-white text-[14px]"
            >
              x
            </button>
          </div>

          <input
            value={inputValues[index] || ""}
            onChange={(e) => handleChange(e, index)}
            className="w-full min-h-[30px] border border-black outline-none px-[12px]"
            type="text"
            placeholder="Add a task..."
          />
          <button
            onClick={() => handleAddText(index)}
            className="w-full h-8 border-2 border-black mt-2 flex items-center justify-center bg-white"
          >
            Add
          </button>
          <div className="mt-4 w-full space-y-2">
            {input.arr.map((task, taskIndex) => (
              <motion.div
                key={taskIndex}
                drag
                onDragStart={() =>
                  setDraggedTask({ task, fromIndex: index, taskIndex })
                }
                className="flex gap-[8px] p-2 bg-black/20 rounded justify-between items-center"
              >
                {editingTask &&
                editingTask.inputIndex === index &&
                editingTask.taskIndex === taskIndex ? (
                  <>
                    <input
                      value={editingTask.value}
                      onChange={handleEditChange}
                      className="px-[8px] py-[4px] w-[150px] text-[20px]"
                    />
                    <div className="flex gap-[4px]">
                      <button
                        onClick={saveEdit}
                        className="bg-white text-[16px] px-[8px]"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-white text-[16px] px-[8px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      className={`text-white text-[16px] flex-1 ${
                        task.done ? "line-through opacity-50" : ""
                      }`}
                    >
                      {task.text}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleDone(index, taskIndex)}
                        className="bg-white text-[12px] px-[8px]"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => deleteTask(index, taskIndex)}
                        className="bg-white text-[12px] px-[8px]"
                      >
                        Delete
                      </button>
                      <button
                        className="bg-white text-[12px] px-[8px]"
                        onClick={() =>
                          startEditing(index, taskIndex, task.text)
                        }
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}

      <div className="fixed bottom-[20px] left-[50%] transform -translate-x-1/2 flex flex-col items-center gap-[20px]">
        {popup && (
          <div className="flex gap-[20px]">
            {["blue", "red", "green", "yellow", "purple"].map((color) => (
              <button
                key={color}
                onClick={() => addTask(color)}
                className="w-[50px] h-[50px] rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
        <button
          onClick={togglePopup}
          className="w-[48px] h-[48px] rounded-full border border-black flex items-center justify-center bg-white"
        >
          <p className="text-xl">+</p>
        </button>
      </div>
    </div>
  );
}

export default Main;
