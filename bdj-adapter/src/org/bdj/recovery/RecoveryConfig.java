package org.bdj.recovery;

import java.io.*;

/**
 * Persistent recovery state for a BD-J autoloader.
 *
 * Integration boundary: call this class around the existing exploit entry
 * point. Do not modify Lapse, Poops, offsets, or payload-loader internals.
 */
public final class RecoveryConfig {
    private static final String PATH = "/data/ps4_autoloader_recovery.cfg";
    private static final int MAX_FAILURES = 3;

    public static final class State {
        public boolean enabled;
        public boolean pending;
        public int failures;

        public boolean isLockedOut() {
            return !enabled || failures >= MAX_FAILURES;
        }
    }

    private RecoveryConfig() {}

    public static State load() {
        State state = new State();
        state.enabled = false; // Safe default: user must explicitly enable.
        state.pending = false;
        state.failures = 0;

        File file = new File(PATH);
        if (!file.exists()) return state;

        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new FileReader(file));
            String line;
            while ((line = reader.readLine()) != null) {
                int separator = line.indexOf('=');
                if (separator <= 0) continue;
                String key = line.substring(0, separator).trim();
                String value = line.substring(separator + 1).trim();

                if ("ENABLED".equals(key)) state.enabled = "1".equals(value);
                else if ("PENDING".equals(key)) state.pending = "1".equals(value);
                else if ("FAILURES".equals(key)) {
                    try { state.failures = Integer.parseInt(value); }
                    catch (NumberFormatException ignored) { state.failures = 0; }
                }
            }
        } catch (IOException ignored) {
            state.enabled = false;
        } finally {
            if (reader != null) try { reader.close(); } catch (IOException ignored) {}
        }

        if (state.failures < 0) state.failures = 0;
        return state;
    }

    public static State recoverInterruptedAttempt() {
        State state = load();
        if (state.pending) {
            state.pending = false;
            state.failures++;
            if (state.failures >= MAX_FAILURES) state.enabled = false;
            save(state);
        }
        return state;
    }

    public static void enable() {
        State state = load();
        state.enabled = true;
        state.pending = false;
        state.failures = 0;
        save(state);
    }

    public static void disable() {
        State state = load();
        state.enabled = false;
        state.pending = false;
        save(state);
    }

    public static boolean beginAttempt() {
        State state = load();
        if (state.isLockedOut()) return false;
        state.pending = true;
        save(state);
        return true;
    }

    public static void confirmSuccess() {
        State state = load();
        state.pending = false;
        state.failures = 0;
        save(state);
    }

    public static State confirmFailure() {
        State state = load();
        state.pending = false;
        state.failures++;
        if (state.failures >= MAX_FAILURES) state.enabled = false;
        save(state);
        return state;
    }

    private static void save(State state) {
        File target = new File(PATH);
        File parent = target.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();

        File temporary = new File(PATH + ".tmp");
        PrintWriter writer = null;
        try {
            writer = new PrintWriter(new FileWriter(temporary));
            writer.println("ENABLED=" + (state.enabled ? "1" : "0"));
            writer.println("PENDING=" + (state.pending ? "1" : "0"));
            writer.println("FAILURES=" + state.failures);
            writer.flush();
            writer.close();
            writer = null;

            if (target.exists() && !target.delete())
                throw new IOException("Could not replace recovery state");
            if (!temporary.renameTo(target))
                throw new IOException("Could not commit recovery state");
        } catch (IOException ignored) {
            // A persistence failure must never enable automatic execution.
            state.enabled = false;
        } finally {
            if (writer != null) writer.close();
        }
    }
}
