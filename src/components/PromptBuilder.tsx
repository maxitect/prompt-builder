import React, { useState, useEffect, KeyboardEvent, useRef, JSX } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrefixPanel } from "./panels/PrefixPanel";
import { SuffixPanel } from "./panels/SuffixPanel";
import { PhasePromptPanel } from "./panels/PhasePromptPanel";
import {
  PrefixesData,
  SuffixesData,
  PhasesConfig,
  PhasePromptsData,
  PromptFragment,
  HistoryLogEntry,
} from "@/types/prompts";

/**
 * Props for the PromptBuilder component
 */
export interface PromptBuilderProps {
  /**
   * The prefixes data
   */
  prefixesData: PrefixesData;
  /**
   * The suffixes data
   */
  suffixesData: SuffixesData;
  /**
   * The phases configuration
   */
  phasesConfig: PhasesConfig;
  /**
   * Map of phase prompts by phase ID
   */
  phasePromptsMap: Record<string, PhasePromptsData>;
  /**
   * Event handler for generating a prompt
   */
  onGenerate?: () => void;
  /**
   * Event handler for tidying and generating a prompt
   */
  onTidyAndGenerate?: () => void;
  /**
   * Event handler for when a prefix is selected
   */
  onSelectPrefix?: (prefix: PromptFragment) => void;
  /**
   * Event handler for when a suffix is selected
   */
  onSelectSuffix?: (suffix: PromptFragment) => void;
  /**
   * Event handler for when a phase prompt is selected
   */
  onSelectPhasePrompt?: (phasePrompt: PromptFragment, phaseId: string) => void;
  /**
   * The selected prefix
   */
  selectedPrefix: PromptFragment | null;
  /**
   * The selected suffix
   */
  selectedSuffix: PromptFragment | null;
  /**
   * The selected phase prompt
   */
  selectedPhasePrompt: PromptFragment | null;
  /**
   * The main text input value
   */
  mainText: string;
  /**
   * Event handler for when the main text changes
   */
  onMainTextChange: (text: string) => void;
  /**
   * The generated prompt
   */
  generatedPrompt: string | null;
  /**
   * Event handler for updating a prefix
   */
  onUpdatePrefix?: (
    prefixId: string,
    newText: string,
    persistChange: boolean
  ) => Promise<boolean>;
  /**
   * Event handler for updating a suffix
   */
  onUpdateSuffix?: (
    suffixId: string,
    newText: string,
    persistChange: boolean
  ) => Promise<boolean>;
  /**
   * Event handler for updating a phase prompt
   */
  onUpdatePhasePrompt?: (
    phaseId: string,
    promptId: string,
    newText: string,
    persistChange: boolean
  ) => Promise<boolean>;
  /**
   * Event handler for restoring a prefix to a previous version
   */
  onRestorePrefix?: (prefixId: string, historyEntry: HistoryLogEntry) => void;
  /**
   * Event handler for restoring a suffix to a previous version
   */
  onRestoreSuffix?: (suffixId: string, historyEntry: HistoryLogEntry) => void;
  /**
   * Event handler for restoring a phase prompt to a previous version
   */
  onRestorePhasePrompt?: (
    phaseId: string,
    promptId: string,
    historyEntry: HistoryLogEntry
  ) => void;
  /**
   * Event handler for deprecating a prefix
   */
  onDeprecatePrefix?: (prefixId: string) => Promise<boolean>;
  /**
   * Event handler for deprecating a suffix
   */
  onDeprecateSuffix?: (suffixId: string) => Promise<boolean>;
  /**
   * Event handler for deprecating a phase prompt
   */
  onDeprecatePhasePrompt?: (
    promptId: string,
    phaseId: string
  ) => Promise<boolean>;
  /**
   * Event handler for creating a new prefix
   */
  onCreatePrefix?: (
    newPrompt: Omit<PromptFragment, "id" | "length" | "history_log">
  ) => Promise<boolean>;
  /**
   * Event handler for creating a new suffix
   */
  onCreateSuffix?: (
    newPrompt: Omit<PromptFragment, "id" | "length" | "history_log">
  ) => Promise<boolean>;
  /**
   * Event handler for creating a new phase prompt
   */
  onCreatePhasePrompt?: (
    phaseId: string,
    newPrompt: Omit<PromptFragment, "id" | "length" | "history_log">
  ) => Promise<boolean>;
}

/**
 * Component that displays the Prompt Builder UI
 * @param props - Component props
 * @returns JSX.Element
 */
export function PromptBuilder({
  prefixesData,
  suffixesData,
  phasesConfig,
  phasePromptsMap,
  onGenerate,
  onTidyAndGenerate,
  onSelectPrefix,
  onSelectSuffix,
  onSelectPhasePrompt,
  selectedPrefix,
  selectedSuffix,
  mainText,
  onMainTextChange,
  generatedPrompt,
  onUpdatePrefix,
  onUpdateSuffix,
  onUpdatePhasePrompt,
  onDeprecatePrefix,
  onDeprecateSuffix,
  onDeprecatePhasePrompt,
  onCreatePrefix,
  onCreateSuffix,
  onCreatePhasePrompt,
}: PromptBuilderProps): JSX.Element {
  // Track if generated prompt is visible
  const [showGenerated, setShowGenerated] = useState<boolean>(false);

  // Update the showGenerated state when generatedPrompt changes
  useEffect(() => {
    setShowGenerated(generatedPrompt !== null);
  }, [generatedPrompt]);

  // Reference to the textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownType, setDropdownType] = useState<
    "all" | "phase" | "prefix" | "suffix"
  >("all");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const handleUpdatePrefix = async (
    prefixId: string,
    newText: string,
    persistChange: boolean
  ) => {
    try {
      if (onUpdatePrefix) {
        const success = await onUpdatePrefix(prefixId, newText, persistChange);
        if (success) {
          toast.success(
            persistChange
              ? "Prefix updated and persisted"
              : "Prefix updated for the current session"
          );
          return;
        }
      }
      toast.error("Failed to update prefix");
    } catch (error) {
      console.error("Error updating prefix:", error);
      toast.error("Error updating prefix");
    }
  };

  // Handler for restoring a prefix version
  const handleRestorePrefixVersion = async (
    prefixId: string,
    historyEntry: HistoryLogEntry
  ) => {
    try {
      if (onUpdatePrefix) {
        const success = await onUpdatePrefix(prefixId, historyEntry.text, true);
        if (success) {
          toast.success("Restored previous version of prefix");
          return;
        }
      }
      toast.error("Failed to restore prefix version");
    } catch (error) {
      console.error("Error restoring prefix version:", error);
      toast.error("Error restoring prefix version");
    }
  };

  // Handlers for suffix updates
  const handleUpdateSuffix = async (
    suffixId: string,
    newText: string,
    persistChange: boolean
  ) => {
    try {
      if (onUpdateSuffix) {
        const success = await onUpdateSuffix(suffixId, newText, persistChange);
        if (success) {
          toast.success(
            persistChange
              ? "Suffix updated and persisted"
              : "Suffix updated for the current session"
          );
          return;
        }
      }
      toast.error("Failed to update suffix");
    } catch (error) {
      console.error("Error updating suffix:", error);
      toast.error("Error updating suffix");
    }
  };

  // Handler for restoring a suffix version
  const handleRestoreSuffixVersion = async (
    suffixId: string,
    historyEntry: HistoryLogEntry
  ) => {
    try {
      if (onUpdateSuffix) {
        const success = await onUpdateSuffix(suffixId, historyEntry.text, true);
        if (success) {
          toast.success("Restored previous version of suffix");
          return;
        }
      }
      toast.error("Failed to restore suffix version");
    } catch (error) {
      console.error("Error restoring suffix version:", error);
      toast.error("Error restoring suffix version");
    }
  };

  // Handlers for phase prompt updates
  const handleUpdatePhasePrompt = async (
    phaseId: string,
    promptId: string,
    newText: string,
    persistChange: boolean
  ) => {
    try {
      if (onUpdatePhasePrompt) {
        const success = await onUpdatePhasePrompt(
          phaseId,
          promptId,
          newText,
          persistChange
        );
        if (success) {
          toast.success(
            persistChange
              ? "Phase prompt updated and persisted"
              : "Phase prompt updated for the current session"
          );
          return;
        }
      }
      toast.error("Failed to update phase prompt");
    } catch (error) {
      console.error("Error updating phase prompt:", error);
      toast.error("Error updating phase prompt");
    }
  };

  // Handler for restoring a phase prompt version
  const handleRestorePhasePromptVersion = async (
    phaseId: string,
    promptId: string,
    historyEntry: HistoryLogEntry
  ) => {
    try {
      if (onUpdatePhasePrompt) {
        const success = await onUpdatePhasePrompt(
          phaseId,
          promptId,
          historyEntry.text,
          true
        );
        if (success) {
          toast.success("Restored previous version of phase prompt");
          return;
        }
      }
      toast.error("Failed to restore phase prompt version");
    } catch (error) {
      console.error("Error restoring phase prompt version:", error);
      toast.error("Error restoring phase prompt version");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Generate prompt shortcuts
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      onGenerate?.();
    } else if (event.ctrlKey && event.key === "t") {
      event.preventDefault();
      onTidyAndGenerate?.();
    }

    // Handle dropdown triggers at the start of a line
    else if (
      event.currentTarget.selectionStart === 0 ||
      event.currentTarget.value.charAt(
        event.currentTarget.selectionStart - 1
      ) === "\n"
    ) {
      const handleDropdownTrigger = (
        type: "all" | "phase" | "prefix" | "suffix"
      ) => {
        event.preventDefault();

        // Calculate position for the dropdown based on cursor position
        if (textareaRef.current) {
          // Get cursor position
          const cursorPosition = textareaRef.current.selectionStart;
          const text = textareaRef.current.value.substring(0, cursorPosition);
          const lines = text.split("\n");
          const currentLineIndex = lines.length - 1;

          // Approximate the position based on line and character counts
          // This is simplified and might need adjustment based on font size, etc.
          const lineHeight = 24; // approximate line height in pixels
          const charWidth = 8; // approximate character width in pixels

          setDropdownPosition({
            top: currentLineIndex * lineHeight + 30, // Add some offset
            left: lines[currentLineIndex].length * charWidth + 10, // Add some offset
          });
        }

        setDropdownType(type);
        setShowDropdown(true);
      };

      if (event.key === "/") {
        handleDropdownTrigger("all");
      } else if (event.key === "#") {
        handleDropdownTrigger("phase");
      } else if (event.key === "$") {
        handleDropdownTrigger("prefix");
      } else if (event.key === "@") {
        handleDropdownTrigger("suffix");
      }
    }
  };

  // Handle selecting an item from the dropdown
  const handleDropdownSelect = (
    item: PromptFragment,
    type: "phase" | "prefix" | "suffix",
    phaseId?: string
  ) => {
    setShowDropdown(false);

    if (type === "prefix" && onSelectPrefix) {
      onSelectPrefix(item);
    } else if (type === "suffix" && onSelectSuffix) {
      onSelectSuffix(item);
    } else if (type === "phase" && onSelectPhasePrompt && phaseId) {
      onSelectPhasePrompt(item, phaseId);
    }
  };

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Top half - Phase Prompt Panel */}
      <div
        className={`grid ${
          showGenerated ? "grid-cols-2 gap-4" : "grid-cols-1"
        }`}
      >
        <div className="w-full">
          <PhasePromptPanel
            phasesConfig={phasesConfig}
            phasePromptsMap={phasePromptsMap}
            onSelectPhasePrompt={onSelectPhasePrompt}
            onUpdatePhasePrompt={handleUpdatePhasePrompt}
            onRestoreVersion={handleRestorePhasePromptVersion}
            onDeprecatePrompt={onDeprecatePhasePrompt}
            onCreatePrompt={onCreatePhasePrompt}
            className="h-full"
          />
        </div>

        {showGenerated && (
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Generated Prompt</h3>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generatedPrompt || "")}
                  size="sm"
                >
                  Copy
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-40px)]">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                  {generatedPrompt}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons - Centered */}
      <div className="flex justify-center gap-4 py-4">
        <Button variant="default" className="px-6" onClick={onGenerate}>
          Generate (Ctrl+Enter)
        </Button>
        <Button
          variant="secondary"
          className="px-6"
          onClick={onTidyAndGenerate}
        >
          Tidy with AI and Generate (Ctrl+T+Enter)
        </Button>
      </div>

      {/* Bottom Panels - Three Columns */}
      <div className="grid grid-cols-3 gap-4 h-[40vh]">
        {/* Left Panel - Prefix */}
        <Card className="h-full">
          <CardContent className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-2">Prefix</h3>
            <div className="mb-2">
              {selectedPrefix && (
                <div className="bg-muted p-2 rounded-md text-sm mb-2">
                  <p className="font-medium">Selected Prefix:</p>
                  <p className="truncate">{selectedPrefix.text}</p>
                </div>
              )}
            </div>
            <ScrollArea className="h-[calc(100%-80px)]">
              <PrefixPanel
                prefixes={prefixesData}
                onSelectPrefix={onSelectPrefix}
                onUpdatePrefix={handleUpdatePrefix}
                onRestoreVersion={handleRestorePrefixVersion}
                onDeprecatePrompt={onDeprecatePrefix}
                onCreatePrompt={onCreatePrefix}
                className="h-full"
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Center Panel - Main Text */}
        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Main Text</h3>
            <div className="flex-grow relative">
              <textarea
                ref={textareaRef}
                className="w-full h-full min-h-[200px] p-2 border rounded-md resize-none"
                placeholder="Type your prompt here... Use keyboard shortcuts: / for general options, # for phase prompts, $ for prefixes, @ for suffixes"
                value={mainText}
                onChange={(e) => onMainTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* Shortcut Dropdown */}
              {showDropdown && (
                <div
                  className="absolute z-10 bg-white dark:bg-gray-800 border shadow-lg rounded-md p-2 w-64"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                  }}
                >
                  <div className="mb-2 px-2 py-1 bg-muted rounded-sm text-sm font-medium">
                    {dropdownType === "all" && "All Prompts"}
                    {dropdownType === "prefix" && "Prefixes"}
                    {dropdownType === "suffix" && "Suffixes"}
                    {dropdownType === "phase" && "Phase Prompts"}
                  </div>

                  <ScrollArea className="h-[200px]">
                    {dropdownType === "prefix" &&
                      prefixesData.prefixes
                        .filter((prefix) => !prefix.deprecated)
                        .map((prefix) => (
                          <button
                            key={prefix.id}
                            className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm mb-1 truncate"
                            onClick={() =>
                              handleDropdownSelect(prefix, "prefix")
                            }
                          >
                            {prefix.text.substring(0, 40)}...
                          </button>
                        ))}

                    {dropdownType === "suffix" &&
                      suffixesData.suffixes
                        .filter((suffix) => !suffix.deprecated)
                        .map((suffix) => (
                          <button
                            key={suffix.id}
                            className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm mb-1 truncate"
                            onClick={() =>
                              handleDropdownSelect(suffix, "suffix")
                            }
                          >
                            {suffix.text.substring(0, 40)}...
                          </button>
                        ))}

                    {(dropdownType === "phase" || dropdownType === "all") &&
                      phasesConfig.phases.map((phase) => (
                        <div key={phase.id} className="mb-2">
                          <div className="px-2 py-1 bg-secondary/20 text-xs font-medium">
                            {phase.name}
                          </div>
                          {phasePromptsMap[phase.id]?.prompts
                            .filter((prompt) => !prompt.deprecated)
                            .map((prompt) => (
                              <button
                                key={prompt.id}
                                className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm mb-1 truncate"
                                onClick={() =>
                                  handleDropdownSelect(
                                    prompt,
                                    "phase",
                                    phase.id
                                  )
                                }
                              >
                                {prompt.text.substring(0, 40)}...
                              </button>
                            ))}
                        </div>
                      ))}

                    {dropdownType === "all" && (
                      <>
                        <div className="px-2 py-1 bg-secondary/20 text-xs font-medium mt-2">
                          Prefixes
                        </div>
                        {prefixesData.prefixes
                          .filter((prefix) => !prefix.deprecated)
                          .slice(0, 3) // Limit shown items
                          .map((prefix) => (
                            <button
                              key={prefix.id}
                              className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm mb-1 truncate"
                              onClick={() =>
                                handleDropdownSelect(prefix, "prefix")
                              }
                            >
                              {prefix.text.substring(0, 40)}...
                            </button>
                          ))}

                        <div className="px-2 py-1 bg-secondary/20 text-xs font-medium mt-2">
                          Suffixes
                        </div>
                        {suffixesData.suffixes
                          .filter((suffix) => !suffix.deprecated)
                          .slice(0, 3) // Limit shown items
                          .map((suffix) => (
                            <button
                              key={suffix.id}
                              className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm mb-1 truncate"
                              onClick={() =>
                                handleDropdownSelect(suffix, "suffix")
                              }
                            >
                              {suffix.text.substring(0, 40)}...
                            </button>
                          ))}
                      </>
                    )}

                    {/* No results message */}
                    {((dropdownType === "prefix" &&
                      prefixesData.prefixes.filter((p) => !p.deprecated)
                        .length === 0) ||
                      (dropdownType === "suffix" &&
                        suffixesData.suffixes.filter((s) => !s.deprecated)
                          .length === 0) ||
                      (dropdownType === "phase" &&
                        Object.values(phasePromptsMap).every(
                          (p) =>
                            p.prompts.filter((prompt) => !prompt.deprecated)
                              .length === 0
                        ))) && (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        No prompts available
                      </div>
                    )}
                  </ScrollArea>

                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Suffix */}
        <Card className="h-full">
          <CardContent className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-2">Suffix</h3>
            <div className="mb-2">
              {selectedSuffix && (
                <div className="bg-muted p-2 rounded-md text-sm mb-2">
                  <p className="font-medium">Selected Suffix:</p>
                  <p className="truncate">{selectedSuffix.text}</p>
                </div>
              )}
            </div>
            <ScrollArea className="h-[calc(100%-80px)]">
              <SuffixPanel
                suffixes={suffixesData}
                onSelectSuffix={onSelectSuffix}
                onUpdateSuffix={handleUpdateSuffix}
                onRestoreVersion={handleRestoreSuffixVersion}
                onDeprecatePrompt={onDeprecateSuffix}
                onCreatePrompt={onCreateSuffix}
                className="h-full"
              />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
