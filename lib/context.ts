const START_DELIMITER = "--- OPENCLAW CONTEXT START ---";
const END_DELIMITER = "--- OPENCLAW CONTEXT END ---";

/**
 * Extracts the OpenClaw context block from a project description.
 * Throws if the delimiters are not found.
 */
export function extractOpenClawContext(description: string): string {
  const startIdx = description.indexOf(START_DELIMITER);
  const endIdx = description.indexOf(END_DELIMITER);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(
      "No se encontró el bloque OPENCLAW CONTEXT en la descripción del proyecto. " +
        "Asegúrate de que la descripción contenga los delimitadores correctos."
    );
  }

  const content = description
    .slice(startIdx + START_DELIMITER.length, endIdx)
    .trim();

  if (!content) {
    throw new Error("El bloque OPENCLAW CONTEXT está vacío");
  }

  return content;
}
